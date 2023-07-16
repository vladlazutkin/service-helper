"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importStar(require("winston"));
const alignColorsAndTime = winston_1.default.format.combine(winston_1.default.format.colorize({
    all: true,
}), winston_1.default.format.label({
    label: '[LOG]',
}), winston_1.default.format.timestamp({
    format: 'HH:mm:ss',
}), winston_1.default.format.printf((info) => `${info.label}${info.timestamp}  ${info.level}: ${info.message}`));
exports.logger = (0, winston_1.createLogger)({
    level: 'debug',
    transports: [
        new winston_1.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), alignColorsAndTime),
        }),
    ],
});
//# sourceMappingURL=index.js.map