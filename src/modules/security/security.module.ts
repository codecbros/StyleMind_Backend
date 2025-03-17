import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth/controllers/auth.controller';
import { AuthService } from './auth/services/auth.service';
import { PrismaService } from '@shared/services/prisma.service';
import { JwtStrategy } from './jwt-strategy/jwt.strategy';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { SupabaseStrategy } from './jwt-strategy/supabase.strategy';
import supabaseConfig from './config/supabase.config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(supabaseConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, SupabaseStrategy],
})
export class SecurityModule {}
