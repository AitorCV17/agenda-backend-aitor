import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ms from 'ms';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
      }

      const payload = {
        userId: (decoded as any).userId,
        email: (decoded as any).email,
        role: (decoded as any).role,
      };

      const expiresInValue: string = process.env.JWT_EXPIRES_IN || '1h';
      const msFn = ms as unknown as (val: string) => number;
      const expiresInMilliseconds: number = msFn(expiresInValue);
      const expiresInSeconds: number = Math.floor(expiresInMilliseconds / 1000);

      const newToken = jwt.sign(
        payload,
        process.env.JWT_SECRET as string,
        { expiresIn: expiresInSeconds }
      );

      res.setHeader('x-refreshed-token', newToken);
      req.user = decoded;
      next();
    });
  } else {
    return res.status(401).json({ message: 'No está autenticado' });
  }
};
