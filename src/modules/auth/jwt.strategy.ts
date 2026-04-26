// src/modules/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

const JWT_FALLBACK_SECRET = 'EMIS_2026_super_secure_jwt_secret_!@#_x9KpL2mQz';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
    console.log(`🛡️ [JwtStrategy] Initializing strategy (Secret Present: ${!!process.env.JWT_SECRET})`);
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null;
          
          // 1. Try parsed cookies
          if (req?.cookies?.['access_token']) {
            token = req.cookies['access_token'];
            console.log(`🔍 [JwtStrategy] Token found in parsed cookies`);
          } 
          
          // 2. Try raw cookie header manually
          if (!token && req.headers?.cookie) {
            const match = req.headers.cookie.match(/access_token=([^;]+)/);
            if (match) {
              token = match[1];
              console.log(`🔍 [JwtStrategy] Token found via manual cookie parse`);
            }
          }

          if (!token) console.log(`⚠️ [JwtStrategy] No token found in request to ${req.url}`);
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      console.log(`❌ [JwtStrategy] Invalid payload:`, JSON.stringify(payload));
      return null;
    }
    console.log(`✅ [JwtStrategy] Validation successful for user: ${payload.sub}`);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
