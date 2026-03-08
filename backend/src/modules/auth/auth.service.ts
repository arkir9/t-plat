import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';

const OAUTH_PLACEHOLDER_PASSWORD = 'oauth-no-password-placeholder';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(registerDto: RegisterDto) {
    const { email, password, phone, firstName, lastName } = registerDto;

    // Check for existing user — throw a clear conflict rather than silently signing in
    const existingUser = await this.usersRepository.findOne({
      where: phone ? [{ email }, { phone }] : [{ email }],
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email or phone number already exists. Please log in instead.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      passwordHash: hashedPassword,
      phone,
      firstName,
      lastName,
    });

    const saved = await this.usersRepository.save(user);
    const tokens = await this.generateTokens(saved.id);

    return {
      user: this.sanitizeUser(saved),
      ...tokens,
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['organizerProfiles'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  async loginWithGoogle(
    dto: GoogleAuthDto,
  ): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }
    const client = new OAuth2Client(googleClientId);
    let payload: { email: string; name?: string; picture?: string; sub: string };
    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload() as typeof payload;
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.email) {
      throw new UnauthorizedException('Google token did not contain email');
    }
    const user = await this.findOrCreateOAuthUser({
      email: payload.email,
      firstName: payload.name?.split(' ')[0] ?? null,
      lastName: payload.name?.split(' ').slice(1).join(' ') ?? null,
      profileImageUrl: payload.picture ?? null,
      googleId: payload.sub,
      appleSub: null,
    });
    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Apple OAuth ──────────────────────────────────────────────────────────

  async loginWithApple(
    dto: AppleAuthDto,
  ): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const appleJwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));
    let payload: { sub: string; email?: string };
    try {
      const { payload: p } = await jwtVerify(dto.identityToken, appleJwks, {
        issuer: 'https://appleid.apple.com',
        audience: this.configService.get<string>('APPLE_CLIENT_ID') ?? undefined,
      });
      payload = p as typeof payload;
    } catch {
      throw new UnauthorizedException('Invalid Apple token');
    }
    if (!payload?.sub) {
      throw new UnauthorizedException('Apple token did not contain sub');
    }
    const fullName = dto.fullName?.trim();
    const firstName = fullName ? fullName.split(' ')[0] : null;
    const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : null;
    const user = await this.findOrCreateOAuthUser({
      email: payload.email ?? undefined,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      googleId: null,
      appleSub: payload.sub,
    });
    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organizerProfiles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────

  async refreshToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (token) {
        await this.refreshTokenRepository.delete(token.id);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(token.user.id);

    // Rotate: delete old refresh token
    await this.refreshTokenRepository.delete(token.id);

    return tokens;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
    return { message: 'Logged out successfully' };
  }

  /**
   * Revoke ALL refresh tokens for a user (e.g. "log out all devices").
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.refreshTokenRepository.delete({ userId });
    return { message: 'Logged out from all devices' };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async findOrCreateOAuthUser(params: {
    email?: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl?: string | null;
    googleId: string | null;
    appleSub: string | null;
  }): Promise<User> {
    const { email, firstName, lastName, profileImageUrl, googleId, appleSub } = params;
    let user: User | null = null;

    if (googleId) {
      user = await this.usersRepository.findOne({ where: { googleId } });
    }
    if (!user && appleSub) {
      user = await this.usersRepository.findOne({ where: { appleSub } });
    }
    if (!user && email) {
      user = await this.usersRepository.findOne({ where: { email } });
    }

    if (user) {
      // Link OAuth identifiers to an existing account
      let changed = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (appleSub && !user.appleSub) {
        user.appleSub = appleSub;
        if (email && !user.email) {
          user.email = email;
        }
        changed = true;
      }
      if (changed) {
        await this.usersRepository.save(user);
      }
      return user;
    }

    if (!email) {
      throw new UnauthorizedException(
        'Apple Sign-In: email is required on first sign-in',
      );
    }

    const placeholderHash = await bcrypt.hash(OAUTH_PLACEHOLDER_PASSWORD, 10);
    const newUser = this.usersRepository.create({
      email,
      passwordHash: placeholderHash,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      profileImageUrl: profileImageUrl ?? undefined,
      emailVerified: true,
      googleId: googleId ?? undefined,
      appleSub: appleSub ?? undefined,
    });
    await this.usersRepository.save(newUser);
    return newUser;
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Limit tokens per user to prevent unbounded growth (keep last 10 devices)
    const existingTokens = await this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    if (existingTokens.length >= 10) {
      const toDelete = existingTokens.slice(0, existingTokens.length - 9);
      await this.refreshTokenRepository.remove(toDelete);
    }

    await this.refreshTokenRepository.save({
      userId,
      token: refreshTokenValue,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  /**
   * Strip sensitive fields and compute role correctly.
   *
   * BUG FIX: Previously any user with organizerProfiles would be returned as
   * 'organizer' regardless of their DB role or profile verification status.
   * Now we trust the DB `role` column as the source of truth; organizer
   * profiles are included for client-side UI hints but don't override role.
   */
  private sanitizeUser(user: User) {
    const { passwordHash, ...rest } = user as any;
    return {
      ...rest,
      // Trust the DB role column — do NOT derive from profile presence
      role: rest.role ?? 'user',
    };
  }
}