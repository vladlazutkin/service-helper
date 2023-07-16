"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const spotify_1 = __importDefault(require("./spotify"));
const imageTextReader_1 = __importDefault(require("./imageTextReader"));
const videoTextReader_1 = __importDefault(require("./videoTextReader"));
const jwt_auth_middleware_1 = __importDefault(require("../middlewares/jwt.auth.middleware"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.json({
        message: 'API - 👋🌎🌍🌏',
    });
});
router.use('/auth', auth_1.default);
router.use('/spotify', spotify_1.default);
router.use('/read-text-from-image', jwt_auth_middleware_1.default, imageTextReader_1.default);
router.use('/read-text-from-video', jwt_auth_middleware_1.default, videoTextReader_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map