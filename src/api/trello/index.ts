import express from 'express';
import boards from './boards';
import cards from './cards';
import columns from './columns';
import labels from './labels';

const router = express.Router();

router.use('/boards', boards);
router.use('/columns', columns);
router.use('/labels', labels);
router.use('/cards', cards);

export default router;
