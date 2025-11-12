import { BaseRouter } from "./baseRouter";
import { FileController } from "@/controllers/FileController";
import { uploadMiddleware } from "@/middlewares/fileUpload";

export class FileRouter extends BaseRouter {
  private fileController: FileController;

  constructor() {
    super({
      prefix: ""
    });
    this.fileController = new FileController();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Upload file to file server (localhost:6969)
    // Returns: { success, attachment: { url: "http://localhost:6969/filename", ... }, messageType }
    // Frontend can directly access the file through the returned URL
    this.router.post(
      "/upload",
      uploadMiddleware.single("file"),
      this.fileController.uploadFile.bind(this.fileController)
    );

    // Get files for a specific message
    // Returns all attachments associated with a message
    this.router.get(
      "/message/:messageId",
      this.fileController.getMessageFiles.bind(this.fileController)
    );

    // Serve/proxy files - redirects to file server
    // Usage: /api/files/:fileName redirects to http://localhost:6969/:fileName
    this.router.get("/:fileName", this.fileController.serveFile.bind(this.fileController));

    // Delete file
    this.router.delete("/:fileId", this.fileController.deleteFile.bind(this.fileController));

    // Health check for file storage
    this.router.get("/health/storage", (req, res) => {
      const fileServerUrl = process.env.FILE_SERVER_URL || "http://localhost:6969";
      res.json({
        status: "ok",
        fileServerUrl: fileServerUrl,
        timestamp: new Date().toISOString(),
      });
    });
  }
}
