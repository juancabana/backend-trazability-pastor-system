import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  displayName: string;
  associationId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'pastor_jwt_secret_2026',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
