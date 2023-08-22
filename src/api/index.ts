import express from 'express';
import auth from './auth';
import notes from './notes';
import spotify from './spotify';
import videos from './video';
import image from './image';
import trello from './trello';
import users from './users';
import authenticateJWT from '../middlewares/jwt.auth.middleware';
import achievements from './achievements';
import chessGames from './chess-games';
import chessSkins from './chess-skins';
import chessConfigs from './chess-configs';
import stripe from './stripe';
import notificationSubscriptions from './notification-subscriptions';

const router = express.Router();

router.use('/auth', auth);
router.use('/stripe', stripe);
router.use('/spotify', authenticateJWT, spotify);
router.use('/chess-skins', authenticateJWT, chessSkins);
router.use(
  '/notification-subscriptions',
  authenticateJWT,
  notificationSubscriptions
);
router.use('/chess-configs', authenticateJWT, chessConfigs);
router.use('/achievements', authenticateJWT, achievements);
router.use('/chess-games', authenticateJWT, chessGames);
router.use('/users', authenticateJWT, users);
router.use('/trello', authenticateJWT, trello);
router.use('/note', authenticateJWT, notes);
router.use('/video', authenticateJWT, videos);
router.use('/image', authenticateJWT, image);

export default router;
