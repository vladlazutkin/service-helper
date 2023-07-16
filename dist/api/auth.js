"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../models/user");
const jwt_auth_middleware_1 = __importDefault(require("../middlewares/jwt.auth.middleware"));
const getUserFromRequest_1 = require("../helpers/getUserFromRequest");
const router = express_1.default.Router();
router.post('/login-spotify', jwt_auth_middleware_1.default, async (req, res) => {
    const user = (0, getUserFromRequest_1.getUserFromRequest)(req);
    const userId = user._id;
    const redirectUrl = `http://localhost:${process.env.PORT}/api/v1/spotify/callback`;
    const url = `https://accounts.spotify.com/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&state=${userId}&scope=playlist-modify-public,playlist-modify-private,&redirect_uri=${encodeURIComponent(redirectUrl)}`;
    return res.status(200).json({ message: 'Url generated', url });
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let user = await user_1.UserModel.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid Credentials' });
    }
    bcrypt_1.default.compare(password, user.password, (err) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Invalid Credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user?._id }, process.env.TOKEN_SECRET, {
            expiresIn: '365d',
        });
        return res
            .status(200)
            .json({ message: 'User Logged in Successfully', token });
    });
});
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    let userExists = await user_1.UserModel.findOne({ email });
    if (userExists) {
        res.status(401).json({ message: 'Email is already in use.' });
        return;
    }
    const saltRounds = 10;
    bcrypt_1.default.hash(password, saltRounds, (err, hash) => {
        if (err) {
            throw new Error('Internal Server Error');
        }
        const user = new user_1.UserModel({
            email,
            password: hash,
        });
        user.save().then(() => {
            res.json({ message: 'User registered successfully' });
        });
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map