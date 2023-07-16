import { Request } from 'express';
import { CustomRequest } from '../interfaces/CustomRequest';

export const getUserFromRequest = (req: Request) => (req as CustomRequest).user;
