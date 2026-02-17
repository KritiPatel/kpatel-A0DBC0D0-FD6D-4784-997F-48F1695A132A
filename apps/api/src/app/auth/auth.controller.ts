import { Controller, Post, Body, Get, UseGuards, Request, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '@task-manager/data';

class LoginBodyDto {
  email: string;
  password: string;
}

class RegisterBodyDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  organizationId: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBodyDto, @Ip() ip: string) {
    return this.authService.login(body.email, body.password, ip);
  }

  @Post('register')
  async register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
