import sizeOf from 'image-size';
interface Dimensions {
  width: number;
  height: number;
}

export const getDimensions = (path: string): Promise<Dimensions> => {
  return new Promise((resolve) => {
    sizeOf(path, (err, dimensions) => {
      if (!dimensions) {
        return;
      }
      resolve({ width: dimensions.width!, height: dimensions.height! });
    });
  });
};
