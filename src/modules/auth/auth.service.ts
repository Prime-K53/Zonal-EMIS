// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async signup(signupDto: SignupDto) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { email: signupDto.email } });
      if (existing) {
        throw new BadRequestException('Email already in use');
      }

      const passwordHash = await bcrypt.hash(signupDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: signupDto.email,
          name: signupDto.name,
          passwordHash,
          role: 'TDC_OFFICER', // Default role for zonal system
        },
      });

      const { passwordHash: _, ...result } = user;
      const payload = { email: user.email, sub: user.id, role: user.role };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: result,
      };
    } catch (error) {
      console.error('Signup Service Error:', error);
      throw error;
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { passwordHash: _, ...result } = user;
    return { user: result };
  }
}
