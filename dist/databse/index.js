"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../logger");
const connectDatabase = () => {
    mongoose_1.default.connect(process.env.MONGO_DB_CONNECT_URL).then(() => {
        logger_1.logger.debug('Connected to Database Successfully');
    });
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=index.js.map