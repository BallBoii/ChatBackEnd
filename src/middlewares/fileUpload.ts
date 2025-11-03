import multer from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

const tempDir = "/tmp/uploads";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, tempDir); // Temporary storage
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Create safe filename without spaces
    const cleanName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
      .replace(/_{2,}/g, "_"); // Replace multiple underscores with single

    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(cleanName);
    const nameWithoutExt = path.basename(cleanName, ext);

    const safeFileName = `${timestamp}_${random}_${nameWithoutExt}${ext}`;
    cb(null, safeFileName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Invalid file type"));
  },
});
