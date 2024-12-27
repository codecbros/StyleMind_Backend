import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
// import { Environment } from '@shared/constants/environment';
import { InfoUserInterface } from '@/modules/security/jwt-strategy/info-user.interface';
import { environment } from '@/shared/constants/environment';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: environment.JWT_SECRET_KEY,
    });
  }
  async validate(payload: InfoUserInterface) {
    return { id: payload.id, sessionId: payload.sessionId, role: payload.role };
  }
}
