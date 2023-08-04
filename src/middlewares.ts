import { NextFunction, Request, Response } from 'express';
import ErrorResponse from './interfaces/ErrorResponse';
import { logger } from './logger';

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  logger.error(`🔍 - Not Found - ${req.originalUrl}`);
  next('Route not found');
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
}
