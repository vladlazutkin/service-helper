"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilesFromFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const getFilesFromFolder = async (folderPath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.readdir(folderPath, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files.map((path) => `${folderPath}/${path}`));
        });
    });
};
exports.getFilesFromFolder = getFilesFromFolder;
//# sourceMappingURL=getFramesFromVideo.js.map