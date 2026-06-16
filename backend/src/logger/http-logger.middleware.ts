import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent');
    const startTime = Date.now();

    const originalSend = res.send;
    const logger = this.logger;

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const message = `${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${ip}`;

      if (statusCode >= 500) {
        logger.error(message);
      } else if (statusCode >= 400) {
        logger.warn(message);
      } else {
        logger.log(message);
      }

      return originalSend.call(this, data);
    };

    next();
  }
}
