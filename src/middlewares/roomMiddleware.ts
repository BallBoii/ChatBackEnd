import crypto from "crypto";
import { AppError } from "@/types/error/AppError";
import { config } from "@/config/config";

import type { Request, Response, NextFunction } from "express";

// Augment Request to carry room context
declare module "express-serve-static-core" {
  interface Request {
    room?: {
      token: string;       // raw for this request only (do not persist)
      tokenHash: string;   // sha256(token)
    };
  }
}

const TOKEN_REGEX = /^[A-Za-z0-9_-]{6,64}$/;

export function makeRoomGuard(
  rooms: Map<string, { members: number }>,
  opts: { allowCreate: boolean } = { allowCreate: false }
) {
  return function roomGuard(req: Request, _res: Response, next: NextFunction) {
    if (!req.room) return next(new AppError("Unauthorized: Room context missing", 401));
    const r = rooms.get(req.room.tokenHash);

    if (!r) {
      if (opts.allowCreate) return next();
      return next(new AppError("Not Found: Room not found", 404));
    }

    // if (r.locked) return next(new AppError("Forbidden: Room is locked", 403));

    return next();
  };
}

export function roomMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = (req.body?.token ?? req.query?.token ?? req.headers["x-room-token"]) as string | undefined;

  if (!token || typeof token !== "string" || !TOKEN_REGEX.test(token)) {
    return next(new AppError("Unauthorized: Invalid token", 401));
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  req.room = { token, tokenHash };
  return next();
}