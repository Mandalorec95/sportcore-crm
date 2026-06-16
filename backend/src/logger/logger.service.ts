import { Injectable, ConsoleLogger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private logDir = process.env.LOG_DIR || './logs';

  constructor() {
    super('SportPass CRM');
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeToFile(level: string, message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    const logMessage = `[${timestamp}] [${level}] [${context || 'App'}] ${message}\n`;

    try {
      fs.appendFileSync(logFile, logMessage, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Failed to write log:', e);
    }
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.writeToFile('INFO', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context);
    this.writeToFile('ERROR', `${message}\n${trace}`, context);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.writeToFile('WARN', message, context);
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
    if (process.env.NODE_ENV === 'development') {
      this.writeToFile('DEBUG', message, context);
    }
  }

  verbose(message: string, context?: string) {
    super.verbose(message, context);
    if (process.env.NODE_ENV === 'development') {
      this.writeToFile('VERBOSE', message, context);
    }
  }
}
