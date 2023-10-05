import express from 'express';
import { VideoModel } from '../../models/video';
import { VideoRangeModel } from '../../models/video-range';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import { multerUploadMemory } from '../../middlewares/multer.middleware';
import { logger } from '../../logger';
import youtube from './youtube';
import tikTok from './tik-tok';
import instagram from './instagram';
import axios from 'axios';
import fs, { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

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
// router.post(
//   '/recognize',
//   multerUpload.single('file'),
//   async (req: any, res) => {
//     try {
//       const folderPath = 'frames/videpl';
//       const files = await convertToFrames(
//         'videos/videoplayback.mp4',
//         folderPath,
//         150
//       );
//
//       const scheduler = createScheduler();
//       const worker = await createWorker({
//         logger: (arg: LoggerMessage) =>
//           logger.debug(`${arg.jobId}-${arg.progress}`),
//       });
//       await worker.loadLanguage('eng');
//       await worker.initialize('eng');
//       scheduler.addWorker(worker);
//
//       const results = await Promise.all(
//         files.map(async (path) => {
//           const rectangle = {
//             left: 0,
//             top: 0,
//             width: 200,
//             height: 200,
//           };
//           return scheduler.addJob('recognize', path, { rectangle });
//         })
//       );
//       await scheduler.terminate();
//
//       const textData = results
//         .map((data) => data.data.text.replaceAll('\n', ' '))
//         .filter((t) => t.length > 10);
//       res.json({
//         text: textData,
//       });
//     } catch (e: any) {
//       const message = e.message || e.msg || 'Error';
//       logger.error(message);
//       res.status(500).json({ error: message });
//     }
//   }
// );

router.post('/extract-audio-from-url', async (req: any, res) => {
  try {
    const { url } = req.body;

    const path = `videos/${uuidv4()}`;
    const writer = createWriteStream(path);

    logger.info('Getting video from remote');
    await axios(url, { responseType: 'stream' }).then((response) => {
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error: any = null;
        writer.on('error', (err: any) => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            resolve(true);
          }
        });
      });
    });

    const buffer = fs.readFileSync(path);

    logger.info('Sending file to the ffmpeg service');
    const response = await axios.post(
      `${process.env.FFMPEG_BACKEND_URL}/videos/extract-audio`,
      buffer,
      {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    fs.unlinkSync(path);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', response.headers['content-length']);

    response.data.pipe(res);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post(
  '/extract-audio-from-file',
  multerUploadMemory.single('file'),
  async (req: any, res) => {
    try {
      logger.info('Sending file to the ffmpeg service');
      const response = await axios.post(
        `${process.env.FFMPEG_BACKEND_URL}/videos/extract-audio`,
        req.file.buffer,
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', response.headers['content-length']);

      response.data.pipe(res);
    } catch (e: any) {
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

export default router;
