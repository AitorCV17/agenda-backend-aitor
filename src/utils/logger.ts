import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
      )
    }),
    new transports.File({
      filename: 'logs/audit.log',
      format: format.combine(format.timestamp(), format.json())
    })
  ]
});
