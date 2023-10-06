import axios from 'axios';

export const getConfig = (link: string) => {
  return axios(`${process.env.PYTHON_BACKEND_URL}/get-config?url=${link}`);
};
