// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request, Res, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as express from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {
    console.log('🏗️ AuthController initialized. AuthService:', !!this.authService);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and return JWT token' })
  @ApiResponse({ status: 200, description: 'Return JWT token and user info.' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: express.Response) {
    console.log(`🔑 [AuthController] Login attempt for: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    console.log(`🎟️ [AuthController] Login success. Setting access_token cookie.`);
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
    return result;
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(@Body() signupDto: SignupDto, @Res({ passthrough: true }) response: express.Response) {
    console.log(`📝 [AuthController] Signup attempt for: ${signupDto.email}`);
    const result = await this.authService.signup(signupDto);
    console.log(`🎟️ [AuthController] Signup success. Setting access_token cookie.`);
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Res({ passthrough: true }) response: express.Response) {
    response.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @Get('test-injection')
  @ApiOperation({ summary: 'Test service injection' })
  testInjection() {
    return {
      authServiceDefined: !!this.authService,
      timestamp: new Date().toISOString()
    };
  }
}
