"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    spotifyAccessToken: { type: String },
    spotifyRefreshToken: { type: String },
    notes: [
        {
            ref: 'Note',
            type: mongoose_1.Schema.Types.ObjectId,
        },
    ],
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.js.map