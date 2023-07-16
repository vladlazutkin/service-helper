"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../models/user");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, async (err, userData) => {
            if (err) {
                return res.sendStatus(403);
            }
            const { id } = userData;
            const user = (await user_1.UserModel.findById(id))?.toObject();
            if (!user) {
                res.sendStatus(401);
                return next();
            }
            const { password, ...data } = user;
            req.user = data;
            next();
        });
    }
    else {
        res.sendStatus(401);
    }
};
exports.default = authenticateJWT;
//# sourceMappingURL=jwt.auth.middleware.js.map