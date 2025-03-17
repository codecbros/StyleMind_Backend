import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@modules/security/auth/dtos/LoginDto';
import { PrismaService } from '@shared/services/prisma.service';
import { compare } from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import supabaseConfig from '../../config/supabase.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private db: PrismaService,
    @Inject(supabaseConfig.KEY)
    private environment: ConfigType<typeof supabaseConfig>,
  ) {}

  supabase = createClient(this.environment.url, this.environment.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  async login(payload: LoginDto) {
    const user = await this.db.user
      .findUniqueOrThrow({
        where: { email: payload.email },
        select: {
          id: true,
          password: true,
          systemRole: true,
          status: true,
        },
      })
      .catch(() => {
        throw new BadRequestException('Usuario no encontrado');
      });

    if (!user.status)
      throw new UnauthorizedException('El usuario se encuentra desactivado');

    if (!(await compare(payload.password, user.password))) {
      await this.registerSession(user.id, true);

      throw new BadRequestException('Contraseña incorrecta');
    }

    const session = await this.registerSession(user.id, false);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    console.log(data, error);

    return {
      token: this.jwt.sign({
        id: session.id,
        role: user.systemRole,
      }),
      role: user.systemRole,
    };
  }

  private async registerSession(userId: string, failed: boolean) {
    return await this.db.session.create({
      data: {
        userId,
        failed,
      },
      select: {
        id: true,
      },
    });
  }
}
