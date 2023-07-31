import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    const extArray = file.mimetype.split('/');
    const extension = extArray[extArray.length - 1];
    cb(null, `${uuidv4()}.${extension}`);
  },
});

const multerUpload = multer({ storage });

const profileIconsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'profile/');
  },
  filename: (req, file, cb) => {
    const extArray = file.mimetype.split('/');
    const extension = extArray[extArray.length - 1];
    cb(null, `${uuidv4()}.${extension}`);
  },
});

export const multerUploadProfileIcon = multer({ storage: profileIconsStorage });

export default multerUpload;
