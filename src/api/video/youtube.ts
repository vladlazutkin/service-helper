import fs from 'fs';
import express from 'express';
import ytdl from 'ytdl-core';
import { v4 as uuidv4 } from 'uuid';
import { createScheduler, createWorker, RecognizeResult } from 'tesseract.js';
import { VideoModel } from '../../models/video';
import { UserModel } from '../../models/user';
import { VIDEO_RANGE_STATUS, VideoRangeModel } from '../../models/video-range';
import { getUserFromRequest } from '../../helpers/shared/getUserFromRequest';
import throttle from '../../helpers/shared/trottle';
import {
  convertToFrames,
  downloadPartOfVideo,
  getFilesFromFolder,
  prepareDimensions,
  preProcessFrames,
} from '../../helpers/video';
import { RangeMap } from '../../interfaces/Range';
import { logger } from '../../logger';
import { io } from '../../socket';
import * as https from 'https';
import axios from 'axios';

const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

const router = express.Router();

router.post('/create-info', async (req, res) => {
  try {
    const { link } = req.body;
    const user = getUserFromRequest(req);

    const data = await ytdl.getInfo(link);
    const url = data.formats.find((f) => f.itag === 18)?.url;

    const videoDb = await VideoModel.create({
      url,
      youtubeUrl: link,
      user: await UserModel.findById(user._id),
    });

    res.json(videoDb);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/download-videos-from-playlist', async (req, res) => {
  try {
    const { playlistId, audioOnly } = req.body;

    const { data } = await youtube.playlistItems.list({
      part: 'contentDetails,snippet',
      playlistId: playlistId,
      maxResults: 50,
    });
    const urls = await Promise.all(
      data.items.map(async (item: any) => {
        const { videoId } = item.contentDetails;
        const data = await ytdl.getInfo(videoId);
        if (audioOnly) {
          const audioFormats = ytdl.filterFormats(data.formats, 'audioonly');
          return audioFormats[0].url;
        }
        return data.formats.find((f) => f.itag === 18)?.url!;
      })
    );

    res.json({
      urls,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/download-audio', async (req, res) => {
  try {
    const { link } = req.body;

    const data = await ytdl.getInfo(link);
    const audioFormats = ytdl.filterFormats(data.formats, 'audioonly');

    res.json({
      url: audioFormats[0].url,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post('/download', async (req, res) => {
  try {
    const { link } = req.body;

    const data = await ytdl.getInfo(link);
    const url = data.formats.find((f) => f.itag === 18)?.url!;

    res.json({
      url,
    });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.post<{}, {}, { id: string; data: RangeMap[]; language: string }>(
  '/recognize',
  async (req, res) => {
    try {
      const { id: videoId, data, language } = req.body;
      if (!videoId) {
        return res.status(400).json({
          message: 'provide id',
        });
      }

      const video = await VideoModel.findById(videoId);

      if (!video) {
        return res.status(404).json({
          message: 'video not found',
        });
      }

      const scheduler = createScheduler();
      const worker = await createWorker();
      await worker.loadLanguage(language);
      await worker.initialize(language);
      scheduler.addWorker(worker);

      // Remove all ranges
      await VideoRangeModel.deleteMany({ video: video._id });

      const response = await Promise.all(
        data.map(async ({ range, dimensions }) => {
          const throttleEmit = throttle(500);

          const roundedDimensions = prepareDimensions(dimensions);

          const rangeDb = await VideoRangeModel.create({
            video,
            result: [],
            range,
            roundedDimensions,
          });
          const folderPath = `frames/${videoId}/${range.id}`;

          const tempVideoId = uuidv4();
          const tempVideoPath = `videos/${tempVideoId}.mp4`;
          await downloadPartOfVideo(
            video.url,
            tempVideoPath,
            range.start,
            range.stop - range.start,
            (progress) => {
              io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
                progress: Math.round(progress / 2),
              });

              VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
                progress: Math.round(progress / 2),
              }).exec();
              logger.debug(`Downloading progress: ${progress}%`);
            }
          );

          io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
            progress: 50,
          });

          VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
            progress: 50,
            status: VIDEO_RANGE_STATUS.VIDEO_DOWNLOADED,
          }).exec();

          await convertToFrames(tempVideoPath, folderPath, 60);
          await preProcessFrames(folderPath);
          const files = await getFilesFromFolder(folderPath);
          const totalFrames = files.length;
          let frames = 0;

          const results = await Promise.all(
            files.map(async (path) => {
              return scheduler
                .addJob('recognize', path, { rectangle: roundedDimensions })
                .then((res: RecognizeResult) => {
                  frames += 1;

                  throttleEmit(() => {
                    const progress =
                      50 + Math.round(((frames / totalFrames) * 100) / 2);

                    io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
                      progress,
                    });
                    VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
                      progress,
                    }).exec();

                    logger.debug(
                      `Recognize progress: ${frames}/${totalFrames} - ${Math.round(
                        (frames / totalFrames) * 100
                      )}%`
                    );
                  });

                  return res;
                });
            })
          );

          // Filter for incorrect data and unique
          const textData = Array.from(
            new Set(
              results
                .map((data) => data.data.text.replaceAll('\n', ' '))
                .filter((t) => t.length > 5)
            )
          );

          await VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
            result: textData,
            progress: 100,
            status: VIDEO_RANGE_STATUS.RECOGNIZED,
          });

          io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
            progress: 100,
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
      const message = e.message || e.msg || 'Error';
      logger.error(message);
      res.status(500).json({ error: message });
    }
  }
);

export default router;
