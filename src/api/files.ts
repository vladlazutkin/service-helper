import express from 'express';
import { DesktopFileModel } from '../models/desktop-file';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { logger } from '../logger';

const router = express.Router();

router.get('/', async (req: any, res) => {
  try {
    const userFromRequest = getUserFromRequest(req);

    const files = await DesktopFileModel.find({ user: userFromRequest._id });

    res.status(200).json(files);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { path, name } = req.body;
    const user = getUserFromRequest(req);

    const file = await DesktopFileModel.create({
      path,
      name,
      user: user._id,
    });
    return res.status(200).json(file);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserFromRequest(req);

    const file = await DesktopFileModel.findById(id).populate('user');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (file.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await DesktopFileModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

export default router;
