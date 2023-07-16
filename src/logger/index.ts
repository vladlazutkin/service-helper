import winston, { createLogger, transports } from 'winston';

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.label({
    label: '[LOG]',
  }),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(
    (info) => `${info.label}${info.timestamp}  ${info.level}: ${info.message}`
  )
);

export const logger = createLogger({
  level: 'debug',
  transports: [
    new transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        alignColorsAndTime
      ),
    }),
  ],
});
