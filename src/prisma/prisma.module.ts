import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global de moi module deu dung duoc PrismaService ma khong can import lai. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
