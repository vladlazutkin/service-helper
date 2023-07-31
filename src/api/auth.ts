import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { buildSpotifyCallbackUrl } from '../helpers/spotify';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';
import { spotifyApi } from '../external-api/spotify';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

router.get('/login-spotify', jwtAuthMiddleware, async (req, res) => {
  try {
    const user = getUserFromRequest(req);
    const url = buildSpotifyCallbackUrl(user._id);

    return res.status(200).json({ message: 'Url generated', url });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/login', async (req: any, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    bcrypt.compare(password, user.password, (err, isSame) => {
      if (err) {
        logger.error(err.message);
        return res.status(401).json({ message: 'Invalid Credentials' });
      }

      if (!isSame) {
        logger.debug('wrong password');
        return res.status(401).json({ message: 'Invalid Credentials' });
      }

      const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET!, {
        expiresIn: '365d',
      });

      return res
        .status(200)
        .json({ message: 'User logged in successfully', token });
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/register', async (req: any, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await UserModel.findOne({ email });

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
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/spotify/callback', async (req: any, res) => {
  try {
    const userId = req.query.state;

    if (!userId) {
      logger.debug('No user id provided in spotify callback');
      return res.status(401).json({
        message: 'No user id',
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      logger.debug('User doesnt exist in spotify callback');
      return res.status(401).json({
        message: 'no user',
      });
    }

    const data = await spotifyApi.authorizationCodeGrant(req.query.code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    if (accessToken && refreshToken) {
      await UserModel.findByIdAndUpdate(userId, {
        spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
      });
    }

    res.json({
      message: 'Successfully logged in. You can close this page',
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/google/login', async (req: any, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        message: 'Something went wrong while google login',
      });
    }

    const { email, picture } = payload;

    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
        email,
        profileIcon: picture,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET!, {
      expiresIn: '365d',
    });

    return res
      .status(200)
      .json({ message: 'User logged in successfully', token });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
