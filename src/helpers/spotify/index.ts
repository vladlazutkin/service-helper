import SpotifyWebApi from 'spotify-web-api-node';
import { logger } from '../../logger';
import { UserModel } from '../../models/user';
import { createLoggedInSpotifyApi } from '../../external-api/spotify';

const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.PROD_URL}/api/v1/auth/spotify/callback`;
  }
  return `http://localhost:${process.env.PORT}/api/v1/auth/spotify/callback`;
};

export const buildSpotifyCallbackUrl = (userId: string) => {
  const redirectUrl = getRedirectUrl();
  return `https://accounts.spotify.com/authorize?client_id=${
    process.env.CLIENT_ID
  }&response_type=code&state=${userId}&scope=playlist-modify-public,playlist-modify-private,&redirect_uri=${encodeURIComponent(
    redirectUrl
  )}`;
};

export const withUpdateAccessToken = async (
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
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          spotifyAccessToken: accessToken,
        },
        { new: true }
      );
      if (!updatedUser) {
        throw new Error('Error updating access token');
      }
      const updateApi = await createLoggedInSpotifyApi(
        updatedUser.spotifyAccessToken!,
        updatedUser.spotifyRefreshToken!
      );
      await fn(updateApi);
    } else {
      throw new Error(e);
    }
  }
};
