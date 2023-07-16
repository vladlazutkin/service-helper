"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToFrames = void 0;
const ffmpeg_1 = __importDefault(require("ffmpeg"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../../logger");
const convertToFrames = async (path, outputPath, nFrames = 30, startTime, duration) => {
    logger_1.logger.debug(`convertToFrames params: ${startTime} - ${duration}`);
    let finalPath = path;
    let hasTemp = !!startTime && !!duration;
    if (startTime && duration) {
        const createVideo = await new ffmpeg_1.default(path);
        if (!fs_1.default.existsSync('videos/temp')) {
            fs_1.default.mkdirSync('videos/temp');
        }
        const tempPath = `videos/temp/${(0, uuid_1.v4)()}.mp4`;
        await createVideo
            .setVideoStartTime(startTime)
            .setVideoDuration(duration)
            .save(tempPath);
        finalPath = tempPath;
    }
    const video = await new ffmpeg_1.default(finalPath);
    const files = await video.fnExtractFrameToJPG(outputPath, {
        start_time: startTime,
        duration_time: duration,
        every_n_frames: nFrames,
    });
    if (hasTemp) {
        fs_1.default.unlinkSync(finalPath);
    }
    logger_1.logger.debug('Converted to frames successfully');
    return files;
};
exports.convertToFrames = convertToFrames;
//# sourceMappingURL=convertToFrames.js.map