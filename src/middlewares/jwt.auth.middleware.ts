import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { JwtPayload } from '../interfaces/JwtPayload';
import { CustomRequest } from '../interfaces/CustomRequest';

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.TOKEN_SECRET!, async (err, userData) => {
      if (err) {
        return res.sendStatus(403);
      }

      const { id } = userData as JwtPayload;
      const user = (await UserModel.findById(id))?.toObject();
      if (!user) {
        res.sendStatus(401);
        return next();
      }
      const { password, ...data } = user;
      (req as CustomRequest).user = data;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export default authenticateJWT;
