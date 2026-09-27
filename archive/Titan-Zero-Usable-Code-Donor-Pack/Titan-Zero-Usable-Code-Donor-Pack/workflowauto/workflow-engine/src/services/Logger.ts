/**
 * Logging service for Workflow Engine
 * Provides structured logging with different levels and contexts
 */

import winston from 'winston';

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
  child(defaultMeta: any): Logger;
}

export class WorkflowLogger implements Logger {
  private winston: winston.Logger;

  constructor(level: string = 'info') {
    this.winston = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'workflow-engine'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      this.winston.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }));
      
      this.winston.add(new winston.transports.File({
        filename: 'logs/combined.log'
      }));
    }
  }

  info(message: string, meta?: any): void {
    this.winston.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.winston.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    this.winston.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.winston.debug(message, meta);
  }

  child(defaultMeta: any): Logger {
    const childLogger = this.winston.child(defaultMeta);
    
    return {
      info: (message: string, meta?: any) => childLogger.info(message, meta),
      warn: (message: string, meta?: any) => childLogger.warn(message, meta),
      error: (message: string, meta?: any) => childLogger.error(message, meta),
      debug: (message: string, meta?: any) => childLogger.debug(message, meta),
      child: (additionalMeta: any) => this.child({ ...defaultMeta, ...additionalMeta })
    };
  }

  getWinstonLogger(): winston.Logger {
    return this.winston;
  }
}