import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { JwtPayload } from '../interfaces/JwtPayload';
import { CustomRequest } from '../interfaces/CustomRequest';

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Auth header not provided' });
  }
  const [_, token] = authHeader.split(' ');

  jwt.verify(token, process.env.TOKEN_SECRET!, async (err, userData) => {
    if (err) {
      return res.status(403).json({ message: 'INVALID_TOKEN' });
    }

    const { id } = userData as JwtPayload;
    const user = (await UserModel.findById(id))?.toObject();
    if (!user) {
      res.status(401).json({ message: 'INVALID_TOKEN' });
      return next();
    }
    const { password, ...data } = user;
    (req as CustomRequest).user = data;
    next();
  });
};

export default authenticateJWT;
