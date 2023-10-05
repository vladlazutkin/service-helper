import express from 'express';
import { createScheduler, createWorker, LoggerMessage } from 'tesseract.js';
import { VideoModel } from '../../models/video';
import { VideoRangeModel } from '../../models/video-range';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import multerUpload from '../../middlewares/multer.middleware';
import { convertToFrames } from '../../helpers/video';
import { logger } from '../../logger';
import youtube from './youtube';
import tikTok from './tik-tok';
import instagram from './instagram';

const router = express.Router();

router.use('/youtube', youtube);
router.use('/instagram', instagram);
router.use('/tik-tok', tikTok);

router.get('/', async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const videos = await VideoModel.find({ user: user._id });

    const withRanges = await Promise.all(
      videos.map(async (video) => {
        const ranges = await VideoRangeModel.find({
          video: video._id,
        });

        return {
          ...video.toObject(),
          videoRanges: ranges,
        };
      })
    );

    return res.status(200).json(withRanges);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id: videoId } = req.params;
    if (!videoId) {
      return res.status(400).json({
        message: 'provide id',
      });
    }

    const video = await VideoModel.findById(videoId)
      .populate({
        path: 'videoRanges',
        model: 'VideoRange',
      })
      .exec();
    const ranges = await VideoRangeModel.find({
      video: videoId,
    });

    if (!video) {
      return res.status(404).json({
        message: 'video not found',
      });
    }
    video.videoRanges = ranges;
    res.json(video);
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

    const video = await VideoModel.findById(id).populate('user');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (video.user._id.toString() !== user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await VideoModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'removed' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

// TODO:update from youtube recognize
router.post(
  '/recognize',
  multerUpload.single('file'),
  async (req: any, res) => {
    try {
      const folderPath = 'frames/videpl';
      const files = await convertToFrames(
        'videos/videoplayback.mp4',
        folderPath,
        150
      );

      const scheduler = createScheduler();
      const worker = await createWorker({
        logger: (arg: LoggerMessage) =>
          logger.debug(`${arg.jobId}-${arg.progress}`),
      });
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      scheduler.addWorker(worker);

      const results = await Promise.all(
        files.map(async (path) => {
          const rectangle = {
            left: 0,
            top: 0,
            width: 200,
            height: 200,
          };
          return scheduler.addJob('recognize', path, { rectangle });
        })
      );
      await scheduler.terminate();

      const textData = results
        .map((data) => data.data.text.replaceAll('\n', ' '))
        .filter((t) => t.length > 10);
      res.json({
        text: textData,
      });
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

export default router;
