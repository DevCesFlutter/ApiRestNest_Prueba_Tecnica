import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    const payload = {
      email: user.email,
      sub: user.id,
      roles: [user.role],
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // Validar si el usuario ya existe
    const exists = await this.authService.findByEmail(registerDto.email);
    if (exists) {
      throw new BadRequestException('El email ya está registrado');
    }
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    // Crear usuario
    const user = await this.authService.createUser({
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
    });
    return {
      message: 'Usuario registrado correctamente',
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
