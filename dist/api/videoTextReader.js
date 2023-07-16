"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const { createWorker, createScheduler } = require('tesseract.js');
const convertToFrames_1 = require("../helpers/video/convertToFrames");
const getDimensions_1 = require("../helpers/getDimensions");
const fs_1 = __importDefault(require("fs"));
const index_1 = require("../index");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const trottle_1 = __importDefault(require("../helpers/trottle"));
const uuid_1 = require("uuid");
const logger_1 = require("../logger");
const user_1 = require("../models/user");
const video_1 = require("../models/video");
const getUserFromRequest_1 = require("../helpers/getUserFromRequest");
const video_range_1 = require("../models/video-range");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: (req, file, cb) => {
        let extArray = file.mimetype.split('/');
        let extension = extArray[extArray.length - 1];
        cb(null, `${(0, uuid_1.v4)()}.${extension}`);
    },
});
const upload = (0, multer_1.default)({ storage });
const router = express_1.default.Router();
// https://www.youtube.com/watch?v=U9svKUcAZdw&t=644s&ab_channel=PatrickMusic
router.post('/youtube/remove', async (req, res) => {
    fs_1.default.unlinkSync(`videos/${req.body.id}.mp4`);
    res.json({ message: 'success' });
});
router.post('/youtube', async (req, res) => {
    const user = (0, getUserFromRequest_1.getUserFromRequest)(req);
    const video = (0, ytdl_core_1.default)(req.body.link, { quality: '18' });
    const data = await ytdl_core_1.default.getInfo(req.body.link);
    const { formats } = data;
    const url = formats.find((f) => f.itag === 18)?.url;
    const videoDb = await video_1.VideoModel.create({
        url,
        user: await user_1.UserModel.findById(user._id),
    });
    const id = videoDb._id;
    const file = fs_1.default.createWriteStream(`videos/${id}.mp4`);
    const throttleEmit = (0, trottle_1.default)(100);
    video.pipe(file);
    video.on('response', (res) => {
        const totalSize = res.headers['content-length'];
        let dataRead = 0;
        res.on('data', (data) => {
            dataRead += data.length;
            const percent = dataRead / totalSize;
            throttleEmit(() => {
                index_1.io.emit(`video-upload-progress-${id}`, { progress: percent * 100 });
                logger_1.logger.debug(`Download progress: ${percent}`);
            });
        });
        res.on('end', async () => {
            index_1.io.emit(`video-upload-progress-${id}`, { progress: 100 });
            logger_1.logger.debug('done download');
            await video_1.VideoModel.findByIdAndUpdate(id, { status: video_1.VideoStatus.LOADED });
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
});
router.post('/youtube/recognize', async (req, res) => {
    const { id: videoId, data, language } = req.body;
    if (!videoId) {
        return res.json({
            message: 'provide id',
        });
    }
    const video = await video_1.VideoModel.findById(videoId);
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
    await video_range_1.VideoRangeModel.deleteMany({ vide: video._id });
    const response = await Promise.all(data.map(async ({ range, dimensions }) => {
        const rangeDb = await video_range_1.VideoRangeModel.create({
            video,
            result: [],
            range,
            dimensions,
        });
        const folderPath = `frames/${videoId}/${range.id}`;
        const files = await (0, convertToFrames_1.convertToFrames)(`videos/${videoId}.mp4`, folderPath, 90, range.start, range.stop - range.start);
        const totalFrames = files.length;
        let frames = 0;
        const results = await Promise.all(files.map(async (path) => {
            return scheduler
                .addJob('recognize', path, dimensions ? { rectangle: dimensions } : {})
                .then((res) => {
                frames += 1;
                index_1.io.emit(`video-recognize-progress-${videoId}-${range.id}`, {
                    total: totalFrames,
                    currentCount: frames,
                });
                logger_1.logger.debug(`Recognize progress: ${frames / totalFrames}`);
                return res;
            });
        }));
        const textData = results
            .map((data) => data.data.text.replaceAll('\n', ' '))
            .filter((t) => t.length > 10);
        await video_range_1.VideoRangeModel.findByIdAndUpdate(rangeDb._id, {
            result: textData,
            status: video_range_1.VideoRangeStatus.RECOGNIZED,
        });
        return {
            id: range.id,
            response: textData,
        };
    }));
    await scheduler.terminate();
    // Remove frames
    fs_1.default.rmSync(`frames/${videoId}`, { recursive: true, force: true });
    res.json(response);
});
router.post('/', upload.single('file'), async (req, res) => {
    const folderPath = 'frames/videpl';
    const files = await (0, convertToFrames_1.convertToFrames)('videos/videoplayback.mp4', folderPath, 150);
    const scheduler = createScheduler();
    const worker = await createWorker({
        logger: (arg) => logger_1.logger.debug(`${arg.jobId}-${arg.progress}`),
    });
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    scheduler.addWorker(worker);
    // const files = await getFilesFromFolder(folderPath);
    const results = await Promise.all(files.map(async (path) => {
        const { width, height } = await (0, getDimensions_1.getDimensions)(path);
        const rectangle = {
            left: 0,
            top: (height / 7) * 6,
            width,
            height: height / 7,
        };
        return scheduler.addJob('recognize', path, { rectangle });
    }));
    await scheduler.terminate();
    const textData = results
        .map((data) => data.data.text.replaceAll('\n', ' '))
        .filter((t) => t.length > 10);
    res.json({
        text: textData,
    });
});
router.post('/youtube/load-result', async (req, res) => {
    const { id: videoId } = req.body;
    if (!videoId) {
        return res.json({
            message: 'provide id',
        });
    }
    const video = await video_1.VideoModel.findById(videoId)
        .populate({
        path: 'videoRanges',
        model: 'VideoRange',
    })
        .exec();
    const ranges = await video_range_1.VideoRangeModel.find({
        video: videoId,
    });
    if (!video) {
        return res.json({
            message: 'video not found',
        });
    }
    video.videoRanges = ranges;
    res.json(video);
});
exports.default = router;
//# sourceMappingURL=videoTextReader.js.map