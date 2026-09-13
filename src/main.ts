import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve thu muc public/ nhu static files (chu yeu la build cua React SPA)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Login/Settings gio nam trong SPA React - dieu huong truy cap goc ve do.
  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    res.redirect('/ai-agent-config/');
  });

  // SPA fallback cho React Router: cac route con nhu /ai-agent-config/history
  // khong ung voi file tinh nao (JS/CSS/favicon da duoc useStaticAssets phuc vu
  // truoc do), nen roi xuong day va tra ve index.html de React Router tu xu ly.
  app.use('/ai-agent-config', (_req: Request, res: Response) => {
    res.sendFile(join(__dirname, '..', 'public', 'ai-agent-config', 'index.html'));
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`He thong Bao cao KiotViet dang chay tren port ${port}`, 'Bootstrap');
  Logger.log('Cron job bao cao se tu dong chay theo gio cau hinh trong Settings (mac dinh 23:00, gio VN).', 'Bootstrap');
}

bootstrap();
