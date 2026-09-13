import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRole } from './user-role.type';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt: Date;
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, role: user.role as UserRole, createdAt: user.createdAt };
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Bootstrap 2 tai khoan mac dinh (Admin + Quan ly AI) neu DB chua co user
   * nao. Chi chay 1 lan duy nhat - lan chay dau tien sau khi build/deploy
   * (khi bang `users` con rong). Cac lan start sau se thay count > 0 va bo qua.
   */
  async onModuleInit(): Promise<void> {
    const count = await this.prisma.user.count();
    if (count > 0) return;

    await this.seedDefaultUser('admin', 'ADMIN_EMAIL', 'admin@ai-office.sys', 'ADMIN_PASSWORD', 'admin123');
    await this.seedDefaultUser(
      'ai_manager',
      'MANAGER_EMAIL',
      'manager@ai-office.sys',
      'MANAGER_PASSWORD',
      'manager123',
    );

    this.logger.warn(
      '[Auth] Da tao 2 tai khoan mac dinh o tren. HAY DANG NHAP VA DOI MAT KHAU (hoac tao lai user moi roi xoa 2 tai khoan nay) TRUOC KHI DUA LEN PRODUCTION.',
    );
  }

  private async seedDefaultUser(
    role: UserRole,
    emailEnvKey: string,
    emailDefault: string,
    passwordEnvKey: string,
    passwordDefault: string,
  ): Promise<void> {
    const email = this.configService.get<string>(emailEnvKey, emailDefault);
    const password = this.configService.get<string>(passwordEnvKey, passwordDefault);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await this.prisma.user.create({ data: { email, passwordHash, role } });
    this.logger.warn(`[Auth] Tai khoan mac dinh (${role}): ${email} / ${password}`);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email hoac mat khau khong dung.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoac mat khau khong dung.');
    }

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: toPublicUser(user) };
  }

  async findPublicById(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Tai khoan khong ton tai (co the da bi xoa).');
    }
    return toPublicUser(user);
  }

  async listUsers(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(toPublicUser);
  }

  async createUser(email: string, password: string, role: UserRole): Promise<PublicUser> {
    if (!email || !password) {
      throw new BadRequestException('Thieu email hoac mat khau.');
    }
    if (password.length < 6) {
      throw new BadRequestException('Mat khau phai co it nhat 6 ky tu.');
    }
    if (role !== 'admin' && role !== 'ai_manager') {
      throw new BadRequestException('Vai tro khong hop le.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email nay da duoc dang ky.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.prisma.user.create({ data: { email, passwordHash, role } });
    return toPublicUser(user);
  }

  async deleteUser(id: number, requesterId: number): Promise<void> {
    if (id === requesterId) {
      throw new ForbiddenException('Khong the tu xoa chinh tai khoan dang dang nhap.');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Tai khoan khong ton tai.');
    }

    if (user.role === 'admin') {
      const adminCount = await this.prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new ForbiddenException('Khong the xoa admin cuoi cung cua he thong.');
      }
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
