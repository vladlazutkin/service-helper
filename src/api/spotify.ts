import express from 'express';
import { VideoRangeModel } from '../models/video-range';
import { chunkArray } from '../helpers/shared/chunkArray';
import { getUserFromRequest } from '../helpers/shared/getUserFromRequest';
import { withUpdateAccessToken } from '../helpers/spotify';
import { logger } from '../logger';
import authenticateJWT from '../middlewares/jwt.auth.middleware';
import { createLoggedInSpotifyApi } from '../external-api/spotify';
import throttle from '../helpers/shared/trottle';
import { io } from '../socket';

require('dotenv').config();

const router = express.Router();

router.post('/search', authenticateJWT, async (req: any, res) => {
  try {
    const searchItems = req.body.search;
    const { rangeId, videoId } = req.body;
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

    let tracksCount = 0;
    for await (const search of searchItems) {
      logger.debug(`Searching for ${search}`);
      const data = await withUpdateAccessToken(
        (api) => api.searchTracks(search, { limit: 1 }),
        userSpotifyApi,
        user._id
      );
      const [item] = data.body.tracks?.items ?? [];

      tracksCount += 1;
      const progress = Math.round((tracksCount / searchItems.length) * 100);
      io.emit(`spotify-search-progress-${videoId}-${rangeId}`, {
        progress,
      });

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

    await VideoRangeModel.findOneAndUpdate(
      { 'range.id': rangeId },
      {
        spotifyTracks: uniques,
      }
    );
    io.emit(`spotify-search-progress-${videoId}-${rangeId}`, {
      progress: 100,
    });

    res.json(uniques);
  } catch (e: any) {
    console.log(e);
    res.status(500).json({ error: e.message || e.msg || 'Error' });
  }
});

router.post<{}, {}, { name: string; tracks: string[]; rangeId: string }>(
  '/create-playlist',
  authenticateJWT,
  async (req, res) => {
    try {
      const name = req.body.name;
      const tracks = req.body.tracks;
      const rangeId = req.body.rangeId;

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

      // Split array
      const chunks = chunkArray(tracks, 50);

      for await (const chunk of chunks) {
        await withUpdateAccessToken(
          (api) =>
            api.addTracksToPlaylist(
              playlist.body.id,
              chunk.map((id) => `spotify:track:${id}`)
            ),
          userSpotifyApi,
          user._id
        );
      }

      await VideoRangeModel.findOneAndUpdate(
        { 'range.id': rangeId },
        {
          playlistUrl: playlist.body.external_urls.spotify,
        }
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

export default router;
