import { letters } from '../../constants/games';

export const cellMap = (i: number, j: number) => {
  const num = 8 - i;
  const letter = letters[j].toUpperCase();

  return {
    num,
    letter,
  };
};

export const revertMap = (from: string) => {
  const [letterFrom, numFrom] = from;

  const i = 8 - +numFrom;
  const j = letters.indexOf(letterFrom.toLowerCase());

  return {
    i,
    j,
  };
};
