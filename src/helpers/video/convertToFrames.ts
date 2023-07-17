import ffmpeg from 'ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { logger } from '../../logger';

export const convertToFrames = async (
  path: string,
  outputPath: string,
  nFrames = 30,
  startTime?: number,
  duration?: number
) => {
  logger.debug(`convertToFrames params: ${startTime} - ${duration}`);
  let finalPath = path;
  let hasTemp = !!startTime && !!duration;
  if (startTime && duration) {
    const createVideo = await new ffmpeg(path);
    if (!fs.existsSync('videos/temp')) {
      fs.mkdirSync('videos/temp');
    }
    const tempPath = `videos/temp/${uuidv4()}.mp4`;
    await createVideo
      .setVideoStartTime(Math.round(startTime))
      .setVideoDuration(Math.round(duration))
      .save(tempPath);

    logger.debug(`Video trimmed successfully`);
    finalPath = tempPath;
  }
  const video = await new ffmpeg(finalPath);
  const files = await video.fnExtractFrameToJPG(outputPath, {
    every_n_frames: nFrames,
  });
  if (hasTemp) {
    fs.unlinkSync(finalPath);
  }

  logger.debug('Converted to frames successfully');
  return files;
};
