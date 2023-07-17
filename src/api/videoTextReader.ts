import express from 'express';
import multer from 'multer';
const { createWorker, createScheduler } = require('tesseract.js');
import { convertToFrames } from '../helpers/video/convertToFrames';
import { LoggerMessage, RecognizeResult } from 'tesseract.js';
import { getDimensions } from '../helpers/getDimensions';
import { RangeMap } from '../interfaces/Range';
import fs from 'fs';
import { io } from '../index';
import ytdl from 'ytdl-core';
import throttle from '../helpers/trottle';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';
import { UserModel } from '../models/user';
import { VideoModel, VideoStatus } from '../models/video';
import { getUserFromRequest } from '../helpers/getUserFromRequest';
import { VideoRangeModel, VideoRangeStatus } from '../models/video-range';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    let extArray = file.mimetype.split('/');
    let extension = extArray[extArray.length - 1];
    cb(null, `${uuidv4()}.${extension}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

// https://www.youtube.com/watch?v=U9svKUcAZdw&t=644s&ab_channel=PatrickMusic

router.post('/youtube/remove', async (req, res) => {
  try {
    fs.unlinkSync(`videos/${req.body.id}.mp4`);
    res.json({ message: 'success' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/youtube', async (req, res) => {
  try {
    const user = getUserFromRequest(req);

    const video = ytdl(req.body.link, { quality: '18' });
    const data = await ytdl.getInfo(req.body.link);
    const { formats } = data;
    const url = formats.find((f) => f.itag === 18)?.url;

    const videoDb = await VideoModel.create({
      url,
      user: await UserModel.findById(user._id),
    });

    const id = videoDb._id;
    const file = fs.createWriteStream(`videos/${id}.mp4`);

    const throttleEmit = throttle(100);

    video.pipe(file);
    video.on('response', (res: any) => {
      const totalSize = res.headers['content-length'];
      let dataRead = 0;
      res.on('data', (data: any) => {
        dataRead += data.length;
        const percent = dataRead / totalSize;
        throttleEmit(() => {
          io.emit(`video-upload-progress-${id}`, { progress: percent * 100 });
          logger.debug(`Download progress: ${percent}`);
        });
      });
      res.on('end', async () => {
        io.emit(`video-upload-progress-${id}`, { progress: 100 });
        logger.debug('done download');
        await VideoModel.findByIdAndUpdate(id, { status: VideoStatus.LOADED });
      });
    });

    // const stream = got.stream(url!).pipe(file);
    // stream.on('uploadProgress', (progress) => {
    //   console.log(progress);
    // });

    //
    // const { data } = await axios.post(
    //   'https://api.ssyoutube.com/api/convert',
    //   {
    //     url: req.body.link,
    //     ts: 1689351563703,
    //     _ts: 1689289349682,
    //     _tsc: 0,
    //     _s: '3f1039480f4d8d6805b23867c04fe16bc6cdb413a4a6333402d4dad5c41a7c29',
    //   },
    //   {
    //     headers: {
    //       accept: 'application/json, text/plain, */*',
    //       'accept-language': 'en,ru;q=0.9,en-US;q=0.8,uk;q=0.7,bg;q=0.6',
    //       'cache-control': 'no-cache',
    //       'content-type': 'application/json',
    //       pragma: 'no-cache',
    //       'sec-ch-ua':
    //         '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    //       'sec-ch-ua-mobile': '?0',
    //       'sec-ch-ua-platform': '"macOS"',
    //       'sec-fetch-dest': 'empty',
    //       'sec-fetch-mode': 'cors',
    //       'sec-fetch-site': 'same-site',
    //       'x-requested-with': 'XMLHttpRequest',
    //     },
    //   }
    // );
    // const id = uuidv4();
    //
    // let count = 0;
    // const interval = setInterval(() => {
    //   count += 10;
    //   io.emit(`video-upload-progress-${id}`, { progress: count });
    //   if (count >= 100) {
    //     clearInterval(interval);
    //   }
    // }, 1000);
    // const url = data.url[0].url;
    // const file = fs.createWriteStream(`videos/${id}.mp4`);
    // const stream = got.stream(url).pipe(file);
    // stream.on('uploadProgress', (progress) => {
    //   console.log(progress);
    //   io.emit(`video-upload-progress-${id}`, { progress: progress.percent });
    // });
    // file.on('finish', () => {
    //   file.close();
    //   clearInterval(interval);
    //   io.emit(`video-upload-progress-${id}`, { progress: 100 });
    //   console.log('Download Completed');
    // });

    // const filename = `videos/${uuidv4()}.mp4`;
    // const file = fs.createWriteStream(filename);
    // const stream = got.stream(url).pipe(file);
    // file.on('finish', () => {
    //   file.close();
    //   console.log('Download Completed');
    // });
    // stream.on('uploadProgress', (progress) => {
    //   console.log(progress);
    // });

    // const filename = `videos/${uuidv4()}.mp4`;
    // video.pipe(fs.createWriteStream(filename));
    // video.on('response', (res: any) => {
    //   const totalSize = res.headers['content-length'];
    //   let dataRead = 0;
    //   res.on('data', (data: any) => {
    //     dataRead += data.length;
    //     const percent = dataRead / totalSize;
    //     console.log((percent * 100).toFixed(2) + '% ');
    //   });
    //   res.on('end', () => {
    //     console.log('done download');
    //   });
    // });

    res.json({
      id,
      url,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post<{}, {}, { id: string; data: RangeMap[]; language: string }>(
  '/youtube/recognize',
  async (req, res) => {
    try {
      const { id: videoId, data, language } = req.body;
      if (!videoId) {
        return res.json({
          message: 'provide id',
        });
      }

      const video = await VideoModel.findById(videoId);

      if (!video) {
        return res.json({
          message: 'video not found',
        });
      }

      const scheduler = createScheduler();
      const worker = await createWorker({
        // logger: (arg: LoggerMessage) =>
        //   console.log(`${arg.jobId}-${arg.progress}`),
      });
      await worker.loadLanguage(language);
      await worker.initialize(language);
      scheduler.addWorker(worker);

      // Remove all ranges
      await VideoRangeModel.deleteMany({ vide: video._id });

      const response = await Promise.all(
        data.map(async ({ range, dimensions }) => {
          const rangeDb = await VideoRangeModel.create({
            video,
            result: [],
            range,
            dimensions,
          });
          const folderPath = `frames/${videoId}/${range.id}`;
          const files = await convertToFrames(
            `videos/${videoId}.mp4`,
            folderPath,
            90,
            range.start,
            range.stop - range.start
          );

          const totalFrames = files.length;
          let frames = 0;
          const results = await Promise.all(
            files.map(async (path) => {
              return scheduler
                .addJob(
                  'recognize',
                  path,
                  dimensions ? { rectangle: dimensions } : {}
                )
                .then((res: RecognizeResult) => {
                  frames += 1;
                  io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
                    total: totalFrames,
                    currentCount: frames,
                  });
                  logger.debug(`Recognize progress: ${frames / totalFrames}`);
                  return res;
                });
            })
          );
          const textData = results
            .map((data) => data.data.text.replaceAll('\n', ' '))
            .filter((t) => t.length > 10);

          await VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
            result: textData,
            status: VideoRangeStatus.RECOGNIZED,
          });

          return {
            id: range.id,
            response: textData,
          };
        })
      );

      await scheduler.terminate();

      // Remove frames
      fs.rmSync(`frames/${videoId}`, { recursive: true, force: true });

      res.json(response);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post('/', upload.single('file'), async (req: any, res) => {
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

    // const files = await getFilesFromFolder(folderPath);
    const results = await Promise.all(
      files.map(async (path) => {
        const { width, height } = await getDimensions(path);
        const rectangle = {
          left: 0,
          top: (height / 7) * 6,
          width,
          height: height / 7,
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
    res.status(500).json({ error: e.message });
  }
});

router.post<{}, {}, { id: string; data: RangeMap[]; language: string }>(
  '/youtube/load-result',
  async (req, res) => {
    try {
      const { id: videoId } = req.body;
      if (!videoId) {
        return res.json({
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
        return res.json({
          message: 'video not found',
        });
      }
      video.videoRanges = ranges;
      res.json(video);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
