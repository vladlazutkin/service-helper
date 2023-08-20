import fs from 'fs';
import express from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { multerUploadProfileIcon } from '../middlewares/multer.middleware';
import { logger } from '../logger';
import authenticateAdminJWT from '../middlewares/jwt-admin.auth.middleware';

const router = express.Router();

router.get('/', authenticateAdminJWT, async (req: any, res) => {
  try {
    const { order, orderBy, limit, skip } = req.query;
    const users = await UserModel.find()
      .sort({
        [orderBy]: order === 'asc' ? 1 : -1,
      })
      .skip(skip)
      .limit(limit);

    const mapped = users.map((user) => {
      const { _id, email, role, profileIcon, spotifyAccessToken } =
        user.toObject();
      return {
        _id,
        email,
        role,
        profileIcon,
        hasSpotifyAccess: !!spotifyAccessToken,
      };
    });
    const total = await UserModel.count();
    res.status(200).json({
      data: mapped,
      total,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/me', async (req: any, res) => {
  try {
    const userFromRequest = getUserFromRequest(req);

    const user = await UserModel.findById(userFromRequest._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { _id, email, role, profileIcon, spotifyAccessToken } =
      user.toObject();
    res.status(200).json({
      _id,
      email,
      role,
      profileIcon,
      hasSpotifyAccess: !!spotifyAccessToken,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/update-email', async (req: any, res) => {
  try {
    const { email } = req.body;
    const user = getUserFromRequest(req);

    await UserModel.findByIdAndUpdate(user._id, { email });

    res.json({
      message: 'success',
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/update-password', async (req: any, res) => {
  try {
    const {
      current: currentPassword,
      new: newPassword,
      repeat: repeatPassword,
    } = req.body;

    if (newPassword !== repeatPassword) {
      return res.status(400).json({
        message: 'New password and repeat mismatch',
      });
    }
    const userFromRequest = getUserFromRequest(req);

    const user = await UserModel.findById(userFromRequest._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saltRounds = 10;

    if (!user.password) {
      return bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
        if (err) {
          throw new Error('Internal Server Error');
        }

        await UserModel.findByIdAndUpdate(user._id, { password: hash });
        return res
          .status(200)
          .json({ message: 'Password updated successfully' });
      });
    }

    bcrypt.compare(currentPassword, user.password, (err, isSame) => {
      if (err) {
        logger.error(err.message);
        throw new Error('Internal Server Error');
      }

      if (!isSame) {
        logger.debug('wrong password');
        return res.status(401).json({ message: 'Wrong password' });
      }

      bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
        if (err) {
          throw new Error('Internal Server Error');
        }

        await UserModel.findByIdAndUpdate(user._id, { password: hash });
        return res
          .status(200)
          .json({ message: 'Password updated successfully' });
      });
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post(
  '/update-profile-icon',
  multerUploadProfileIcon.single('file'),
  async (req: any, res) => {
    try {
      const { path } = req.file;
      const userFromRequest = getUserFromRequest(req);

      const user = await UserModel.findById(userFromRequest._id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.profileIcon && fs.existsSync(user.profileIcon)) {
        fs.unlinkSync(user.profileIcon);
      }

      await UserModel.findByIdAndUpdate(user._id, { profileIcon: path });

      return res.status(200).json({
        profileIcon: path,
        message: 'Profile icon updated',
      });
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

export default router;
