import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { SupabaseAuthStrategy } from 'nestjs-supabase-auth';
import supabaseConfig from '../config/supabase.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(
  SupabaseAuthStrategy,
  'supabase',
) {
  public constructor(
    @Inject(supabaseConfig.KEY)
    private environment: ConfigType<typeof supabaseConfig>,
  ) {
    super({
      supabaseUrl: environment.url,
      supabaseKey: environment.key,
      supabaseOptions: {},
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: any): Promise<any> {
    return super.validate(payload);
  }

  authenticate(req) {
    super.authenticate(req);
  }
}
