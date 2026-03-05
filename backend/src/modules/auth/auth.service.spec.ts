import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let jwtService: JwtService;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+254712345678',
    isActive: true,
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRATION: '1h',
                JWT_REFRESH_EXPIRATION: '7d',
              };
              return map[key] ?? null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      phone: '+254712345678',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user and return tokens', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(mockUser as User);
      usersRepository.save.mockResolvedValue(mockUser as User);
      refreshTokenRepository.create.mockReturnValue({} as RefreshToken);
      refreshTokenRepository.save.mockResolvedValue({} as RefreshToken);

      const result = await service.register(registerDto);

      expect(usersRepository.findOne).toHaveBeenCalled();
      expect(usersRepository.create).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user already exists with wrong password', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as User);
      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should hash the password before saving', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(mockUser as User);
      usersRepository.save.mockResolvedValue(mockUser as User);
      refreshTokenRepository.create.mockReturnValue({} as RefreshToken);
      refreshTokenRepository.save.mockResolvedValue({} as RefreshToken);

      await service.register(registerDto);

      const createArg = usersRepository.create.mock.calls[0][0] as any;
      expect(createArg.passwordHash).toBeDefined();
      expect(createArg.passwordHash).not.toBe(registerDto.password);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };

    it('should login with correct credentials and return tokens + user with role', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword } as User;

      usersRepository.findOne.mockResolvedValue(userWithHash);
      refreshTokenRepository.create.mockReturnValue({} as RefreshToken);
      refreshTokenRepository.save.mockResolvedValue({} as RefreshToken);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException with wrong password', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser as User);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException for invalid refresh token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);
      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        token: 'expired-token',
        expiresAt: new Date('2020-01-01'),
        user: mockUser,
      } as any);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
