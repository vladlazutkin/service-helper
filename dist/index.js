"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const app_1 = __importDefault(require("./app"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const databse_1 = require("./databse");
const logger_1 = require("./logger");
require('dotenv').config();
const server = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io.on('connection', () => {
    console.log('Client connected');
});
const port = process.env.PORT || 5000;
server.listen(port, () => {
    (0, databse_1.connectDatabase)();
    logger_1.logger.debug(`Listening: http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map