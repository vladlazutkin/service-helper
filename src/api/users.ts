import fs from 'fs';
import express from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { multerUploadProfileIcon } from '../middlewares/multer.middleware';
import { logger } from '../logger';
import authenticateAdminJWT from '../middlewares/jwt-admin.auth.middleware';
import { USER_ROLE } from '../interfaces/roles';
import jwtAdminAuthMiddleware from '../middlewares/jwt-admin.auth.middleware';
import { CardModel } from '../models/trello/card';
import { BoardModel } from '../models/trello/board';
import { ColumnModel } from '../models/trello/column';
import { LabelModel } from '../models/trello/label';
import { ChessGameModel } from '../models/games/chess-game';
import { NoteModel } from '../models/note';
import { CommentModel } from '../models/trello/comment';
import { VideoModel } from '../models/video';

const router = express.Router();

router.get('/', authenticateAdminJWT, async (req: any, res) => {
  try {
    const { order, orderBy, limit, skip, search } = req.query;
    const users = await UserModel.find({ email: { $regex: search } })
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

router.post('/switch-admin', authenticateAdminJWT, async (req: any, res) => {
  try {
    const { id } = req.body;
    const me = getUserFromRequest(req);

    if (me._id.toString() === id) {
      return res.status(404).json({ message: "You can't edit yourself" });
    }

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserModel.findByIdAndUpdate(user._id, {
      role: user.role === USER_ROLE.ADMIN ? USER_ROLE.USER : USER_ROLE.ADMIN,
    });

    res.json({
      message: 'success',
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', jwtAdminAuthMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { what } = req.body;
    const me = getUserFromRequest(req);

    if (me._id.toString() === id) {
      return res.status(404).json({ message: "You can't delete yourself" });
    }

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (what.includes('all') || what.includes('boards')) {
      await BoardModel.deleteMany({ user: user._id });
      await ColumnModel.deleteMany({ user: user._id });
      await CardModel.deleteMany({ user: user._id });
      await LabelModel.deleteMany({ user: user._id });
      await CommentModel.deleteMany({ user: user._id });
    }
    if (what.includes('all') || what.includes('chess_games')) {
      await ChessGameModel.deleteMany({ playerWhite: user._id });
    }
    if (what.includes('all') || what.includes('notes')) {
      await NoteModel.deleteMany({ user: user._id });
    }
    if (what.includes('all') || what.includes('video_recognizes')) {
      await VideoModel.deleteMany({ user: user._id });
    }

    await UserModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
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
