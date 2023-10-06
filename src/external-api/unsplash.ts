import axios from 'axios';

export const searchUnsplash = (query: Record<string, string>) => {
  return axios.get(
    `https://unsplash.com/napi/search/photos?query=${new URLSearchParams(
      query
    ).toString()}`
  );
};
