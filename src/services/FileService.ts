import { IFileRepository } from "../repository/FileRepository";
import FileRepository from "../repository/FileRepository";
import { Attachment } from "@prisma/client";
import {
  AttachmentData,
  MessageType,
  CreateFileDto,
} from "@/types/message.types";
import fs from "fs";
import path from "path";
import axios from "axios";
import { config } from "@/config/config";

export class FileService {
  private fileServerUrl = config.FILE_SERVER_URL;
  private publicFileUrl = config.CORS_ORIGIN;

  async uploadFileToDuFS(file: Express.Multer.File): Promise<string> {
    try {
      // Generate a unique filename to avoid collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-]/g, "_");
      const uniqueFileName = `${timestamp}-${randomString}-${baseName}${ext}`;

      const fileBuffer = fs.readFileSync(file.path);
      console.log("[FileService] Uploading file to file server:", this.fileServerUrl, uniqueFileName);
      const response = await axios.put(
        `${this.fileServerUrl}/${encodeURIComponent(uniqueFileName)}`,
        fileBuffer,
        {
          headers: {
            "Content-Type": file.mimetype,
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Clean up temporary file
      fs.unlinkSync(file.path);

      // Return the public URL through Nginx (users will access via /files/)
      return `${this.publicFileUrl}/files/${encodeURIComponent(uniqueFileName)}`;
    } catch (error) {
      console.error("[FileService] File server upload error:", error);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error("Failed to upload to file server");
    }
  }

  // Create attachment record in database when message is created
  async createAttachmentFromData(
    messageId: string,
    attachmentData: AttachmentData
  ): Promise<AttachmentData> {
    const attachment = await FileRepository.create({
      messageId,
      fileName: attachmentData.fileName,
      fileSize: attachmentData.fileSize,
      mimeType: attachmentData.mimeType,
      url: attachmentData.url,
    });

    return FileRepository.toAttachmentData(attachment);
  }

  async uploadFile(fileData: CreateFileDto): Promise<AttachmentData> {
    const attachment = await FileRepository.create(fileData);
    return FileRepository.toAttachmentData(attachment);
  }

  async deleteFileFromDuFS(fileName: string): Promise<void> {
    try {
      await axios.delete(`${this.fileServerUrl}/${encodeURIComponent(fileName)}`);
    } catch (error) {
      console.error("File server delete error:", error);
    }
  }

  async getFilesByMessageId(messageId: string): Promise<AttachmentData[]> {
    const attachments = await FileRepository.findByMessageId(messageId);
    return attachments.map((attachment) =>
      FileRepository.toAttachmentData(attachment)
    );
  }

  getMessageTypeFromFile(mimeType: string): MessageType {
    if (mimeType.startsWith("image/")) {
      return MessageType.IMAGE;
    }
    return MessageType.FILE;
  }

  // Extract filename from DuFS URL for deletion
  extractFileNameFromUrl(url: string): string {
    return url.split("/").pop() || "";
  }
}

export default new FileService();