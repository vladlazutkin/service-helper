import express from 'express';
import auth from './auth';
import notes from './notes';
import spotify from './spotify';
import videos from './video';
import image from './image';
import trello from './trello';
import users from './users';
import authenticateJWT from '../middlewares/jwt.auth.middleware';

const router = express.Router();

router.use('/auth', auth);
router.use('/spotify', authenticateJWT, spotify);
router.use('/users', authenticateJWT, users);
router.use('/trello', authenticateJWT, trello);
router.use('/note', authenticateJWT, notes);
router.use('/video', authenticateJWT, videos);
router.use('/image', authenticateJWT, image);

export default router;
