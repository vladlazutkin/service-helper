import SpotifyWebApi from 'spotify-web-api-node';
import { getRedirectUrl } from '../helpers/spotify';
require('dotenv').config();

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: getRedirectUrl(),
});

export const createLoggedInSpotifyApi = (
  accessToken: string,
  refreshToken: string
) => {
  return new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    accessToken,
    refreshToken,
  });
};
