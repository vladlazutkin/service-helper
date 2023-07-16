import fs from 'fs';

export const getFilesFromFolder = async (
  folderPath: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(files.map((path) => `${folderPath}/${path}`));
    });
  });
};
