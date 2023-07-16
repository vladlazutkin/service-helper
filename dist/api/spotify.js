"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../models/user");
const jwt_auth_middleware_1 = __importDefault(require("../middlewares/jwt.auth.middleware"));
const getUserFromRequest_1 = require("../helpers/getUserFromRequest");
const spotify_1 = require("../external-api/spotify");
const logger_1 = require("../logger");
require('dotenv').config();
const router = express_1.default.Router();
const withUpdateAccessToken = async (fn, api, userId) => {
    try {
        return await fn(api);
    }
    catch (e) {
        if (e.statusCode === 401) {
            logger_1.logger.debug(`Spotify access token for user ${userId} is expired, trying to get a new one`);
            const refreshData = await api.refreshAccessToken();
            const accessToken = refreshData.body.access_token;
            api.setAccessToken(accessToken);
            await user_1.UserModel.findByIdAndUpdate(userId, {
                spotifyAccessToken: accessToken,
            });
            await fn(api);
        }
        else {
            throw new Error(e);
        }
    }
};
router.post('/search', jwt_auth_middleware_1.default, async (req, res) => {
    try {
        const searchItems = req.body.search;
        const result = [];
        const user = (0, getUserFromRequest_1.getUserFromRequest)(req);
        if (!user.spotifyAccessToken || !user.spotifyRefreshToken) {
            return res.status(401).json({
                message: 'Token expired or not provided',
            });
        }
        const userSpotifyApi = await (0, spotify_1.createLoggedInSpotifyApi)(user.spotifyAccessToken, user.spotifyRefreshToken);
        for await (const search of searchItems) {
            const data = await withUpdateAccessToken((api) => api.searchTracks(search, { limit: 1 }), userSpotifyApi, user._id);
            const [item] = data.body.tracks?.items ?? [];
            if (!item) {
                logger_1.logger.debug(`No search result for search=${search}`);
                continue;
            }
            const obj = {
                id: item.id,
                name: item.name,
                imageUrl: item.album.images[0]?.url ?? '',
                artistName: item.artists[0]?.name ?? '',
                externalUrl: item.external_urls.spotify,
                previewUrl: item.preview_url,
            };
            result.push(obj);
            logger_1.logger.debug(`Search result for search=${search}: ${obj.externalUrl}`);
        }
        const map = new Map(result.map((t) => [t.id, t]));
        const uniques = [...map.values()];
        res.json(uniques);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/create-playlist', jwt_auth_middleware_1.default, async (req, res) => {
    const name = req.body.name;
    const tracks = req.body.tracks;
    const user = (0, getUserFromRequest_1.getUserFromRequest)(req);
    if (!user.spotifyAccessToken || !user.spotifyRefreshToken) {
        return res.status(401).json({
            message: 'Token expired or not provided',
        });
    }
    const userSpotifyApi = await (0, spotify_1.createLoggedInSpotifyApi)(user.spotifyAccessToken, user.spotifyRefreshToken);
    try {
        const playlist = await withUpdateAccessToken((api) => api.createPlaylist(name), userSpotifyApi, user._id);
        await withUpdateAccessToken((api) => api.addTracksToPlaylist(playlist.body.id, tracks.map((id) => `spotify:track:${id}`)), userSpotifyApi, user._id);
        res.json({
            url: playlist.body.external_urls.spotify,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/callback', async (req, res) => {
    const userId = req.query.state;
    if (!userId) {
        logger_1.logger.debug('no user id provided in spotify callback');
        return res.status(401).json({
            message: 'no user id',
        });
    }
    const user = await user_1.UserModel.findById(userId);
    if (!user) {
        logger_1.logger.debug('user doesnt exits in spotify callback');
        return res.status(401).json({
            message: 'no user',
        });
    }
    // const BASE64_AUTHORIZATION = new Buffer(
    //   `${process.env.CLIENT_ID!}:${process.env.CLIENT_SECRET!}`
    // ).toString('base64');
    //
    // const redirectUrl = `http://localhost:${process.env.PORT}/api/v1/spotify/callback`;
    const data = await spotify_1.spotifyApi.authorizationCodeGrant(req.query.code);
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    if (accessToken && refreshToken) {
        await user_1.UserModel.findByIdAndUpdate(userId, {
            spotifyAccessToken: accessToken,
            spotifyRefreshToken: refreshToken,
        });
    }
    // const spotifyResponse = await axios.post(
    //   'https://accounts.spotify.com/api/token',
    //   queryString.stringify({
    //     grant_type: 'authorization_code',
    //     code: req.query.code,
    //     redirect_uri: redirectUrl,
    //   }),
    //   {
    //     headers: {
    //       Authorization: `Basic ${BASE64_AUTHORIZATION}`,
    //       'Content-Type': 'application/x-www-form-urlencoded',
    //     },
    //   }
    // );
    // console.log(spotifyResponse.data);
    // const accessToken = spotifyResponse.data.access_token;
    // const refreshToken = spotifyResponse.data.refresh_token;
    // if (accessToken) {
    //   await UserModel.findByIdAndUpdate(userId, {
    //     spotifyAccessToken: accessToken,
    //     refreshToken
    //   });
    // }
    res.json({
        message: 'success',
    });
});
exports.default = router;
//# sourceMappingURL=spotify.js.map