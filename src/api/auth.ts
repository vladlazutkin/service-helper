import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/getUserFromRequest';

const router = express.Router();

router.post('/login-spotify', jwtAuthMiddleware, async (req, res) => {
  const user = getUserFromRequest(req);
  const userId = user._id;

  const redirectUrl = `http://localhost:${process.env.PORT}/api/v1/spotify/callback`;
  const url = `https://accounts.spotify.com/authorize?client_id=${
    process.env.CLIENT_ID
  }&response_type=code&state=${userId}&scope=playlist-modify-public,playlist-modify-private,&redirect_uri=${encodeURIComponent(
    redirectUrl
  )}`;

  return res.status(200).json({ message: 'Url generated', url });
});

router.post('/login', async (req: any, res) => {
  const { email, password } = req.body;

  let user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Invalid Credentials' });
  }

  bcrypt.compare(password, user.password, (err) => {
    if (err) {
      console.log(err);
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
    const token = jwt.sign({ id: user?._id }, process.env.TOKEN_SECRET!, {
      expiresIn: '365d',
    });

    return res
      .status(200)
      .json({ message: 'User Logged in Successfully', token });
  });
});

router.post('/register', async (req: any, res) => {
  const { email, password } = req.body;

  let userExists = await UserModel.findOne({ email });

  if (userExists) {
    res.status(401).json({ message: 'Email is already in use.' });
    return;
  }

  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      throw new Error('Internal Server Error');
    }

    const user = new UserModel({
      email,
      password: hash,
    });

    user.save().then(() => {
      res.json({ message: 'User registered successfully' });
    });
  });
});

export default router;
