import axios from 'axios';

interface GetCdnSeriesConfig {
  translatorId: string;
  type: string;
  id: string;
  season: string;
  episode: string;
}

export const getCdnSeries = ({
  translatorId,
  type,
  id,
  season,
  episode,
}: GetCdnSeriesConfig) => {
  return axios.post(
    `https://rezka.ag/ajax/get_cdn_series/?t=${+new Date()}`,
    {
      id,
      translator_id: translatorId,
      action: type === 'video.movie' ? 'get_movie' : 'get_stream',
      ...(type !== 'video.movie' && {
        season: season,
        episode: episode,
      }),
    },
    {
      proxy: {
        host: '195.189.62.7',
        port: 80,
        protocol: 'http',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    }
  );
};

export const searchRezka = (search: string) => {
  return axios.get(
    `https://rezka.ag/search/?do=search&subaction=search&q=${search}`
  );
};
