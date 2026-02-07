import {
  Injectable,
  UnauthorizedException,
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

  async register(registerDto: RegisterDto) {
    const { email, password, phone, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: phone ? [{ email }, { phone }] : [{ email }],
    });

    if (existingUser) {
      // Verify password and sign them in
      const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('An account with this email already exists. Please use the correct password to sign in.');
      }
      const tokens = await this.generateTokens(existingUser.id);
      return {
        user: this.sanitizeUser(existingUser),
        ...tokens,
      };
    }

    // Hash password and create new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      passwordHash: hashedPassword,
      phone,
      firstName,
      lastName,
    });

    await this.usersRepository.save(user);

    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async loginWithGoogle(dto: GoogleAuthDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }
    const client = new OAuth2Client(googleClientId);
    let payload: { email: string; name?: string; picture?: string; sub: string };
    try {
      const ticket = await client.verifyIdToken({ idToken: dto.idToken, audience: googleClientId });
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

  async loginWithApple(dto: AppleAuthDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
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
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        await this.usersRepository.save(user);
      }
      if (appleSub && !user.appleSub) {
        user.appleSub = appleSub;
        if (email && !user.email) user.email = email;
        await this.usersRepository.save(user);
      }
      return user;
    }
    if (!email) {
      throw new UnauthorizedException('Apple Sign-In: email is required on first sign-in');
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

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organizerProfiles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async refreshToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(token.user.id);

    // Delete old refresh token
    await this.refreshTokenRepository.delete(token.id);

    return tokens;
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d'),
    });

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

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

  private sanitizeUser(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
