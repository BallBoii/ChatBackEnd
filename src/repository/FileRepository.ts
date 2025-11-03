import prisma from "@/config/database";
import { Attachment } from "@prisma/client";
import { AttachmentData } from "@/types/message.types";

export interface IFileRepository {
  create(fileData: Omit<Attachment, "id" | "createdAt">): Promise<Attachment>;
  findById(id: string): Promise<Attachment | null>;
  findByMessageId(messageId: string): Promise<Attachment[]>;
  delete(id: string): Promise<void>;
  update(id: string, data: Partial<Attachment>): Promise<Attachment>;
  toAttachmentData(attachment: Attachment): AttachmentData;
}

export class FileRepository implements IFileRepository {
  async create(
    fileData: Omit<Attachment, "id" | "createdAt">
  ): Promise<Attachment> {
    return await prisma.attachment.create({
      data: fileData,
    });
  }

  async findById(id: string): Promise<Attachment | null> {
    return await prisma.attachment.findUnique({
      where: { id },
    });
  }

  async findByMessageId(messageId: string): Promise<Attachment[]> {
    return await prisma.attachment.findMany({
      where: { messageId },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.attachment.delete({
      where: { id },
    });
  }

  async update(id: string, data: Partial<Attachment>): Promise<Attachment> {
    return await prisma.attachment.update({
      where: { id },
      data,
    });
  }

  toAttachmentData(attachment: Attachment): AttachmentData {
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      url: attachment.url,
    };
  }
}

export default new FileRepository();