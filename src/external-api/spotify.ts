import SpotifyWebApi from 'spotify-web-api-node';
require('dotenv').config();

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: `http://localhost:${process.env.PORT}/api/v1/spotify/callback`,
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
