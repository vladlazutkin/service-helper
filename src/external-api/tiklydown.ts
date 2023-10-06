import axios from 'axios';

export const getTikTokVideo = (url: string) => {
  return axios.get('https://api.tiklydown.eu.org/api/download', {
    params: { url },
  });
};
