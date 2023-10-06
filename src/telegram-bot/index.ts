import TelegramBot from 'node-telegram-bot-api';
import { getTikTokVideo } from '../external-api/tiklydown';
import fs from 'fs';
import { logger } from '../logger';
const videoshow = require('videoshow');

export const initBot = () => {
  const token = process.env.TEELEGRAM_BOT_TOKEN!;

  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    if (msg.text?.includes('https://vm.tiktok.com')) {
      const chatId = msg.chat.id;

      const { data } = await getTikTokVideo(msg.text);
      if (data.video) {
        await bot.sendVideo(chatId, data.video.noWatermark);
        await bot.deleteMessage(chatId, msg.message_id);
      } else if (data.images) {
        const images = data.images.map((image: { url: string }) => image.url);

        const videoOptions = {
          fps: 25,
          loop: Math.floor(data.music.duration / images.length),
          transition: false,
          transitionDuration: 0,
          videoBitrate: 1024,
          videoCodec: 'libx264',
          size: `${data.images[0].width}x${data.images[0].height}`,
          audioBitrate: '128k',
          audioChannels: 2,
          format: 'mp4',
          pixelFormat: 'yuv420p',
        };

        logger.info('Started video creation');
        videoshow(images, videoOptions)
          .audio(data.music.play_url)
          .save('video.mp4')
          .on('end', async (output: string) => {
            console.error('Video created in:', output);
            await bot.sendVideo(chatId, output);
            fs.unlinkSync(output);
            await bot.deleteMessage(chatId, msg.message_id);
          });

        // const urls: TelegramBot.InputMedia[] = data.images.map(
        //   (image: { url: string }) => ({
        //     type: 'photo',
        //     media: image.url,
        //   })
        // );
        // await bot
        //   .sendMediaGroup(chatId, urls, {
        //     reply_to_message_id: msg.message_id,
        //   })
        //   .then(() => {
        //     console.log('sent');
        //   })
        //   .catch((e) => {
        //     console.log('err', e);
        //   });
        // await bot.sendAudio(chatId, data.music.play_url, {
        //   reply_to_message_id: msg.message_id,
        // });
      }
    }
  });
};
