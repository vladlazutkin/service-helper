import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { JwtPayload } from '../interfaces/JwtPayload';
import { CustomRequest } from '../interfaces/CustomRequest';
import { USER_ROLE } from '../interfaces/roles';

const authenticateAdminJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      return res.status(401).json({ message: 'INVALID_TOKEN' });
    }
    if (user.role !== USER_ROLE.ADMIN) {
      return res.status(401).json({ message: 'ADMIN_ROLE_REQUIRED' });
    }
    const { password, ...data } = user;
    (req as CustomRequest).user = data;
    next();
  });
};

export default authenticateAdminJWT;
