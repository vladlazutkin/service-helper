import ffmpeg from 'ffmpeg';
import ffmpegF from 'fluent-ffmpeg';
import fs from 'fs';
import sharp from 'sharp';
import axios from 'axios';
import { logger } from '../../logger';
import { timemarkToSeconds } from '../shared/timemarkToSeconds';
import { Dimensions } from '../../interfaces/Range';

export const getFilesFromFolder = async (
  folderPath: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(
        files
          .map((path) => `${folderPath}/${path}`)
          .sort((a, b) => {
            const number1 = a.slice(a.lastIndexOf('_') + 1, a.lastIndexOf('.'));
            const number2 = b.slice(b.lastIndexOf('_') + 1, b.lastIndexOf('.'));

            return +number1 - +number2;
          })
      );
    });
  });
};

export const preProcessFrames = async (path: string) => {
  logger.debug(` Frames processing start`);
  console.time(`preProcessFrames time`);

  const files = await getFilesFromFolder(path);
  await Promise.all(
    files.map(async (file) => {
      await sharp(file)
        .threshold(128)
        .toBuffer(async (err, buffer) => {
          await fs.promises.writeFile(file, buffer);
        });
    })
  );
  logger.debug('Frames processed successfully');
  console.timeEnd(`preProcessFrames time`);
};

export const convertToFrames = async (
  path: string,
  outputPath: string,
  nFrames = 30
) => {
  logger.debug(`convertToFrames start`);
  const video = await new ffmpeg(path);
  const files = await video.fnExtractFrameToJPG(outputPath, {
    every_n_frames: nFrames,
  });
  fs.unlinkSync(path);

  logger.debug('Converted to frames successfully');
  return files;
};

export const downloadPartOfVideo = async (
  path: string,
  outputPath: string,
  start: number,
  duration: number,
  onProgress: (progress: number) => void
) => {
  logger.debug(`Downloading part of video: ${outputPath}`);
  console.time(`Video download ${outputPath} time`);

  return new Promise((resolve, reject) => {
    const conv = ffmpegF({ source: path });
    conv
      .setStartTime(start)
      .setDuration(duration)
      .on('progress', ({ timemark }) => {
        const time = timemarkToSeconds(timemark);
        const percent = Math.round((time / duration) * 100);

        onProgress(percent);
      })
      .on('end', (err) => {
        if (!err) {
          resolve(true);
          logger.debug(`Downloading done for video: ${outputPath}`);
          console.timeEnd(`Video download ${outputPath} time`);
        } else {
          reject(err);
        }
      })
      .saveToFile(outputPath);
  });
};

export const downloadInstagram = (urlMedia: string) =>
  new Promise(async (resolve, reject) => {
    const BASE_URL = 'https://www.instagram.com/p/';
    const postId = urlMedia
      .replace(' ', '')
      .split('/')
      .filter((x) => x.length > 0)[3];
    try {
      axios(`${BASE_URL}${postId}/?utm_source=ig_web_copy_link?&__a=1&__d=1`, {
        headers: {
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.52',
        },
      })
        .then(function (response) {
          const result = response.data.graphql.shortcode_media;
          if (result) {
            if (result.is_video) {
              resolve({
                type: 'video',
                url: result.video_url,
              });
            } else {
              resolve({
                type: 'photo',
                url: result.display_url,
              });
            }
          }
        })
        .catch(function (error) {
          console.log(error);
          reject(error.message);
        });
    } catch (e: any) {
      reject(e.message);
    }
  });

export const prepareDimensions = (dimensions: Dimensions): Dimensions => ({
  top: Math.round(dimensions.top),
  left: Math.round(dimensions.left),
  height: Math.round(dimensions.height),
  width: Math.round(dimensions.width),
});
