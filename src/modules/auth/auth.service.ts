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

  private sanitizeUser<T extends { passwordHash?: string; assignedSchools?: string | string[] | null }>(user: T) {
    const { passwordHash, assignedSchools, ...rest } = user;
    const parsedAssignments = Array.isArray(assignedSchools)
      ? assignedSchools
      : (() => {
          if (!assignedSchools) return [];
          try {
            return JSON.parse(assignedSchools);
          } catch {
            return [];
          }
        })();

    return {
      ...rest,
      assignedSchools: parsedAssignments,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(pass, user.passwordHash)) {
      return this.sanitizeUser(user);
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

      const result = this.sanitizeUser(user);
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
    return { user: this.sanitizeUser(user) };
  }
}
