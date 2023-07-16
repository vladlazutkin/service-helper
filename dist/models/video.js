"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoModel = exports.VideoStatus = void 0;
const mongoose_1 = require("mongoose");
var VideoStatus;
(function (VideoStatus) {
    VideoStatus["LOADING"] = "loading";
    VideoStatus["LOADED"] = "loaded";
})(VideoStatus = exports.VideoStatus || (exports.VideoStatus = {}));
const videoSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now },
    status: { type: String, enum: VideoStatus, default: VideoStatus.LOADING },
    url: { type: String, required: true },
    user: { ref: 'User', type: mongoose_1.Schema.Types.ObjectId },
    videoRanges: [{ ref: 'VideoRange', type: mongoose_1.Schema.Types.ObjectId }],
});
exports.VideoModel = (0, mongoose_1.model)('Video', videoSchema);
//# sourceMappingURL=video.js.map