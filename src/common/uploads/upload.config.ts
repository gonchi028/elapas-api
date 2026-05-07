import * as multer from 'multer';
import { diskStorage } from 'multer';
import { extname } from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export function createUploadConfig(subfolder: string): multer.Options {
  return {
    storage: diskStorage({
      destination: `uploads/${subfolder}`,
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        cb(null, `${unique}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        cb(
          new Error(
            `Tipo de archivo no permitido. Solo: ${ALLOWED_TYPES.join(', ')}`,
          ),
        );
        return;
      }
      cb(null, true);
    },
    limits: {
      fileSize: MAX_SIZE,
    },
  };
}
