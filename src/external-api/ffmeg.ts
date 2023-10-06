import axios from 'axios';

export const extractAudio = (buffer: Buffer) => {
  return axios.post(
    `${process.env.FFMPEG_BACKEND_URL}/videos/extract-audio`,
    buffer,
    {
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    }
  );
};
