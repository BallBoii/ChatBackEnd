import { Request, Response } from "express";
import FileService from "../services/FileService";
import FileRepository from "../repository/FileRepository";
import { AttachmentData, MessageType } from "@/types/message.types";

// Extend the Request interface to include the file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class FileController {
  // Upload file to DuFS and return temporary attachment data
  async uploadFile(req: MulterRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        console.error("No file in request");
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Upload to DuFS and get the URL
      const dufsUrl = await FileService.uploadFileToDuFS(req.file);

      // Create temporary attachment data (without messageId)
      const attachmentData: AttachmentData = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: dufsUrl,
      };

      const messageType: MessageType = FileService.getMessageTypeFromFile(
        req.file.mimetype
      );

      res.status(201).json({
        success: true,
        attachment: attachmentData,
        messageType,
      });
    } catch (error) {
      console.error("Upload error details:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        file: req.file
          ? {
              originalname: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : null,
      });

      res.status(500).json({
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getMessageFiles(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const attachments: AttachmentData[] =
        await FileService.getFilesByMessageId(messageId);

      res.json({
        success: true,
        attachments,
      });
    } catch (error) {
      console.error("Get files error:", error);
      res.status(500).json({ error: "Failed to get files" });
    }
  }

  async serveFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileName } = req.params;
      const dufsUrl = `http://chat-dufs:5000/${fileName}`;
      res.redirect(dufsUrl);
    } catch (error) {
      res.status(500).json({ error: "File access failed" });
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      await FileService.deleteFileFromDuFS(fileId);

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
}
