"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDimensions = void 0;
const image_size_1 = __importDefault(require("image-size"));
const getDimensions = (path) => {
    return new Promise((resolve) => {
        (0, image_size_1.default)(path, (err, dimensions) => {
            if (!dimensions) {
                return;
            }
            resolve({ width: dimensions.width, height: dimensions.height });
        });
    });
};
exports.getDimensions = getDimensions;
//# sourceMappingURL=getDimensions.js.map