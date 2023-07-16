"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const { createWorker } = require('tesseract.js');
const uuid_1 = require("uuid");
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
router.post('/', upload.single('file'), async (req, res) => {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const rectangle = req.body.dimensions
        ? JSON.parse(req.body.dimensions)
        : null;
    const { data: { text }, } = await worker.recognize(req.file.path, rectangle ? { rectangle } : undefined);
    await worker.terminate();
    res.json({
        text,
    });
});
exports.default = router;
//# sourceMappingURL=imageTextReader.js.map