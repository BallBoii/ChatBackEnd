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

export class FileService {
  private dufsUrl = process.env.DUFS_URL || "http://localhost:6969";

  async uploadFileToDuFS(file: Express.Multer.File): Promise<string> {
    try {
      const safeFileName = file.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileBuffer = fs.readFileSync(file.path);

      const response = await axios.put(
        `${this.dufsUrl}/${encodeURIComponent(safeFileName)}`,
        fileBuffer,
        {
          headers: {
            "Content-Type": file.mimetype,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      // Clean up temporary file
      fs.unlinkSync(file.path);

      return `${this.dufsUrl}/${encodeURIComponent(safeFileName)}`;
    } catch (error) {
      console.error("DuFS upload error:", error);
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error("Failed to upload to DuFS");
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
      await axios.delete(`${this.dufsUrl}/${fileName}`);
    } catch (error) {
      console.error("DuFS delete error:", error);
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