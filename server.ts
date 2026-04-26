// server.ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './src/common/filters/all-exceptions.filter';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Return the correct Content-Type for a file path.
 *  express.static sometimes defaults to application/octet-stream for .js/.mjs
 *  files when the OS MIME database is missing — this map is the authoritative fix. */
function getMimeType(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.cjs':  'text/javascript; charset=utf-8',
    '.ts':   'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.ico':  'image/x-icon',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.eot':  'application/vnd.ms-fontobject',
    '.wasm': 'application/wasm',
    '.map':  'application/json',
    '.txt':  'text/plain; charset=utf-8',
  };
  return map[ext] ?? null;
}

async function bootstrap() {
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);
  if (missingEnv.length > 0) {
    console.error(`💥 Missing required env vars: ${missingEnv.join(', ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  app.use(cookieParser());
  app.enableCors({ origin: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', credentials: true });

  const PORT = process.env.PORT || 4000;

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EMIS Zonal System API')
    .setDescription('Education Management Information System — Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  expressApp.get('/health', (_req: any, res: any) => res.json({ status: 'ok', time: new Date().toISOString() }));

  if (process.env.NODE_ENV !== 'production') {
    // ── DEVELOPMENT: Vite dev server ────────────────────────────────────────
    console.log('🔧 Starting Vite dev middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) return next();
      vite.middlewares(req, res, next);
    });

  } else {
    // ── PRODUCTION: Serve pre-built assets with explicit MIME types ──────────
    console.log('📦 Serving production build from dist/client...');
    const distPath = path.join(__dirname, 'dist', 'client');

    const staticMiddleware = express.static(distPath, {
      // Long-cache hashed assets, no-cache for index.html
      setHeaders(res: any, filePath: string) {
        const mime = getMimeType(filePath);
        if (mime) res.setHeader('Content-Type', mime);

        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
        } else {
          // Vite outputs hashed filenames in assets/ → safe to cache aggressively
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    });

    // Serve static files (skip API routes)
    expressApp.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) return next();
      staticMiddleware(req, res, next);
    });

    // SPA catch-all: serve index.html for any non-API, non-asset route
    expressApp.use((req: any, res: any, next: any) => {
      if (req.url.startsWith('/api')) return next();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  await app.init();
  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Server  → http://localhost:${PORT}`);
  console.log(`📄 API     → http://localhost:${PORT}/api`);
  console.log(`📘 Docs    → http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Mode    → ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch(err => {
  console.error('💥 Bootstrap error:', err);
  process.exit(1);
});
