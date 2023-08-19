import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { check } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import jwtAuthMiddleware from '../middlewares/jwt.auth.middleware';
import { buildSpotifyCallbackUrl } from '../helpers/spotify';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { spotifyApi } from '../external-api/spotify';
import { User, UserModel } from '../models/user';
import { AchievementModel } from '../models/achievement';
import { achievementsBase } from '../constants/achievements';
import AchievementsHandler from '../handlers/achievements-handler';
import { logger } from '../logger';
import { ChessConfigModel } from '../models/games/chess-config';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

const updateUserAchievements = async (user: User) => {
  // await AchievementModel.deleteMany({ user: user._id });
  const userAchievements = await AchievementModel.find({ user: user._id });
  const toAdd = achievementsBase.filter(
    (a) => !userAchievements.find((uA) => uA.toObject().event === a.event)
  );
  await Promise.all(
    toAdd.map((a) =>
      AchievementModel.create({
        ...a,
        user: user._id,
      })
    )
  );
};

const updateUserChessConfig = async (user: User) => {
  const userA = await UserModel.findById(user._id).populate('chessSkins');
  if (userA) {
    userA.chessSkins = [];
    await userA.save();
  }

  const chessConfig = await ChessConfigModel.findOne({
    user: user._id,
  });
  if (!chessConfig) {
    await ChessConfigModel.create({
      user: user._id,
    });
  }
};

const updateUserData = async (user: User) => {
  await Promise.all([
    updateUserAchievements(user),
    updateUserChessConfig(user),
  ]);
};

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

router.post(
  '/login',
  [check('email').isEmail(), check('password').not().isEmpty()],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findOne({ email });

      if (!user) {
        return res.status(401).json({ message: 'Invalid Credentials' });
      }

      bcrypt.compare(password, user.password, async (err, isSame) => {
        if (err) {
          logger.error(err.message);
          return res.status(401).json({ message: 'Invalid Credentials' });
        }

        if (!isSame) {
          logger.debug('wrong password');
          return res.status(401).json({ message: 'Invalid Credentials' });
        }

        await updateUserData(user);
        await AchievementsHandler.onLogin(user._id);

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
  }
);

router.post(
  '/register',
  [check('email').isEmail(), check('password').not().isEmpty()],
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const userExists = await UserModel.findOne({ email });

      if (userExists) {
        res.status(401).json({ message: 'Email is already in use.' });
        return;
      }

      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          throw new Error('Internal Server Error');
        }

        const user = await UserModel.create({
          email,
          password: hash,
        });

        await updateUserAchievements(user);
        await AchievementsHandler.onRegister(user._id);

        res.json({ message: 'User registered successfully' });
      });
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

router.get('/spotify/callback', async (req, res) => {
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

    const data = await spotifyApi.authorizationCodeGrant(
      req.query.code as string
    );

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
      await AchievementsHandler.onRegister(user._id);
    }

    await updateUserData(user);
    await AchievementsHandler.onLogin(user._id);

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
