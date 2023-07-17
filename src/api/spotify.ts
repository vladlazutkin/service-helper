import express from 'express';
import { UserModel } from '../models/user';
import authenticateJWT from '../middlewares/jwt.auth.middleware';
import { getUserFromRequest } from '../helpers/getUserFromRequest';
import { createLoggedInSpotifyApi, spotifyApi } from '../external-api/spotify';
import { logger } from '../logger';
import SpotifyWebApi from 'spotify-web-api-node';

require('dotenv').config();

const router = express.Router();

const withUpdateAccessToken = async (
  fn: (api: SpotifyWebApi) => Promise<any>,
  api: SpotifyWebApi,
  userId: string
) => {
  try {
    return await fn(api);
  } catch (e: any) {
    if (e.statusCode === 401) {
      logger.debug(
        `Spotify access token for user ${userId} is expired, trying to get a new one`
      );
      const refreshData = await api.refreshAccessToken();
      const accessToken = refreshData.body.access_token;
      api.setAccessToken(accessToken);
      await UserModel.findByIdAndUpdate(userId, {
        spotifyAccessToken: accessToken,
      });
      await fn(api);
    } else {
      throw new Error(e);
    }
  }
};

router.post('/search', authenticateJWT, async (req: any, res) => {
  try {
    const searchItems = req.body.search;
    const result = [];

    const user = getUserFromRequest(req);
    if (!user.spotifyAccessToken || !user.spotifyRefreshToken) {
      return res.status(401).json({
        message: 'Token expired or not provided',
      });
    }
    const userSpotifyApi = await createLoggedInSpotifyApi(
      user.spotifyAccessToken,
      user.spotifyRefreshToken
    );

    for await (const search of searchItems) {
      const data = await withUpdateAccessToken(
        (api) => api.searchTracks(search, { limit: 1 }),
        userSpotifyApi,
        user._id
      );
      const [item] = data.body.tracks?.items ?? [];
      if (!item) {
        logger.debug(`No search result for search=${search}`);
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
      logger.debug(`Search result for search=${search}: ${obj.externalUrl}`);
    }
    const map = new Map(result.map((t) => [t.id, t]));
    const uniques = [...map.values()];

    res.json(uniques);
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
  }
});

router.post<{}, {}, { name: string; tracks: string[] }>(
  '/create-playlist',
  authenticateJWT,
  async (req, res) => {
    try {
      const name = req.body.name;
      const tracks = req.body.tracks;
      const user = getUserFromRequest(req);
      if (!user.spotifyAccessToken || !user.spotifyRefreshToken) {
        return res.status(401).json({
          message: 'Token expired or not provided',
        });
      }
      const userSpotifyApi = await createLoggedInSpotifyApi(
        user.spotifyAccessToken,
        user.spotifyRefreshToken
      );
      const playlist = await withUpdateAccessToken(
        (api) => api.createPlaylist(name),
        userSpotifyApi,
        user._id
      );

      await withUpdateAccessToken(
        (api) =>
          api.addTracksToPlaylist(
            playlist.body.id,
            tracks.map((id: string) => `spotify:track:${id}`)
          ),
        userSpotifyApi,
        user._id
      );

      res.json({
        url: playlist.body.external_urls.spotify,
      });
    } catch (e: any) {
      console.log(e);
      res.status(500).json({ error: e.message || e.msg || 'Error' });
    }
  }
);

router.get('/callback', async (req: any, res) => {
  try {
    const userId = req.query.state;

    if (!userId) {
      logger.debug('no user id provided in spotify callback');
      return res.status(401).json({
        message: 'no user id',
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      logger.debug('user doesnt exits in spotify callback');
      return res.status(401).json({
        message: 'no user',
      });
    }

    // const BASE64_AUTHORIZATION = new Buffer(
    //   `${process.env.CLIENT_ID!}:${process.env.CLIENT_SECRET!}`
    // ).toString('base64');
    //
    // const redirectUrl = `http://localhost:${process.env.PORT}/api/v1/spotify/callback`;

    const data = await spotifyApi.authorizationCodeGrant(req.query.code);

    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;
    if (accessToken && refreshToken) {
      await UserModel.findByIdAndUpdate(userId, {
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
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
  }
});

export default router;
