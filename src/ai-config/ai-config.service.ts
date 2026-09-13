import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AI_CONFIG_MAP, AiConfigEntry } from './ai-config.constants';

const CLAUDE_DIR = path.join(process.cwd(), '.claude');

export interface AiConfigResult extends AiConfigEntry {
  agentName: string;
  content: string;
}

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);

  /** Danh sach cac muc de FE dung dung cho sidebar, khong lo noi dung file. */
  listEntries(): Array<{ agentName: string } & AiConfigEntry> {
    return Object.entries(AI_CONFIG_MAP).map(([agentName, entry]) => ({
      agentName,
      ...entry,
    }));
  }

  private resolveEntry(agentName: string): AiConfigEntry {
    const entry = AI_CONFIG_MAP[agentName];
    if (!entry) {
      throw new NotFoundException(`Khong ho tro cau hinh "${agentName}".`);
    }
    return entry;
  }

  async readConfig(agentName: string): Promise<AiConfigResult> {
    const entry = this.resolveEntry(agentName);
    const fullPath = path.join(CLAUDE_DIR, entry.path);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return { agentName, ...entry, content };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        this.logger.warn(`[AiConfig] Chua co file ".claude/${entry.path}" - tra ve noi dung rong.`);
        throw new NotFoundException(
          `File ".claude/${entry.path}" chua ton tai. Nhap noi dung roi luu de tao moi.`,
        );
      }
      this.logger.error(`[AiConfig] Loi doc file ".claude/${entry.path}": ${err.message}`);
      throw new InternalServerErrorException(`Khong doc duoc file cau hinh: ${err.message}`);
    }
  }

  async writeConfig(agentName: string, content: string): Promise<AiConfigResult> {
    const entry = this.resolveEntry(agentName);
    const fullPath = path.join(CLAUDE_DIR, entry.path);

    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      this.logger.log(`[AiConfig] Da ghi de noi dung ".claude/${entry.path}".`);
      return { agentName, ...entry, content };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        this.logger.error(`[AiConfig] Khong co quyen ghi file ".claude/${entry.path}".`);
        throw new InternalServerErrorException('Khong co quyen ghi file cau hinh tren server.');
      }
      this.logger.error(`[AiConfig] Loi ghi file ".claude/${entry.path}": ${err.message}`);
      throw new InternalServerErrorException(`Khong ghi duoc file cau hinh: ${err.message}`);
    }
  }
}
