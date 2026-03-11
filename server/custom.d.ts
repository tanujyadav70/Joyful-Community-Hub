declare module "mongoose";
declare module "bcrypt";
declare module "multer";

declare global {
  namespace Express {
    interface Request {
      file?: {
        originalname: string;
        buffer: Buffer;
      };
    }
  }
}
