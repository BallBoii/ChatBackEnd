import { Router } from "express";
import { FileController } from "@/controllers/FileController";
import { uploadMiddleware } from "@/middlewares/fileUpload";

const fileRouter = Router();
const fileController = new FileController();

// Upload file to DuFS
fileRouter.post(
  "/upload",
  uploadMiddleware.single("file"),
  fileController.uploadFile.bind(fileController)
);

// Get files for a specific message
fileRouter.get(
  "/message/:messageId",
  fileController.getMessageFiles.bind(fileController)
);

// Serve/proxy files through DuFS
fileRouter.get("/:fileName", fileController.serveFile.bind(fileController));

// Delete file
fileRouter.delete("/:fileId", fileController.deleteFile.bind(fileController));

// Health check for file storage
fileRouter.get("/health/storage", (req, res) => {
  res.json({
    status: "ok",
    dufsUrl: process.env.DUFS_URL || "http://chat-dufs:5000",
    timestamp: new Date().toISOString(),
  });
});

export default fileRouter;
