"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoggedInSpotifyApi = exports.spotifyApi = void 0;
const spotify_web_api_node_1 = __importDefault(require("spotify-web-api-node"));
require('dotenv').config();
exports.spotifyApi = new spotify_web_api_node_1.default({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: `http://localhost:${process.env.PORT}/api/v1/spotify/callback`,
});
const createLoggedInSpotifyApi = (accessToken, refreshToken) => {
    return new spotify_web_api_node_1.default({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        accessToken,
        refreshToken,
    });
};
exports.createLoggedInSpotifyApi = createLoggedInSpotifyApi;
//# sourceMappingURL=spotify.js.map