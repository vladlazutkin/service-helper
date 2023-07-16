"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoRangeModel = exports.VideoRangeStatus = void 0;
const mongoose_1 = require("mongoose");
var VideoRangeStatus;
(function (VideoRangeStatus) {
    VideoRangeStatus["RECOGNIZING"] = "recognizing";
    VideoRangeStatus["RECOGNIZED"] = "recognized";
})(VideoRangeStatus = exports.VideoRangeStatus || (exports.VideoRangeStatus = {}));
const videoRangeSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: VideoRangeStatus,
        default: VideoRangeStatus.RECOGNIZING,
    },
    video: { ref: 'Video', type: mongoose_1.Schema.Types.ObjectId },
    result: [{ type: String, required: true }],
    range: {
        id: { type: String },
        start: { type: Number },
        stop: { type: Number },
    },
    dimensions: {
        left: { type: Number },
        top: { type: Number },
        width: { type: Number },
        height: { type: Number },
    },
});
exports.VideoRangeModel = (0, mongoose_1.model)('VideoRange', videoRangeSchema);
//# sourceMappingURL=video-range.js.map