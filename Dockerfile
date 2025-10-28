FROM node:20-alpine AS builder

# Use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfile first for better layer cache
COPY pnpm-lock.yaml package.json ./

# Install all deps (รวม dev deps เพื่อ build Prisma Client/TS)
RUN pnpm install --frozen-lockfile

# Prisma schema first for better cache
COPY prisma ./prisma/
RUN pnpm prisma:generate

# Copy source
COPY . .

# Build TS
RUN pnpm build


# -------- Production stage --------
FROM node:20-alpine AS production

# Prisma on Alpine ต้องการ openssl และ (มัก) libc6-compat
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Copy only needed files
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# ตัด dev deps ออกให้เล็กลง
COPY --from=builder /app/node_modules ./node_modules
# ถ้าอยากเล็กสุด ให้ใช้:
# RUN corepack enable && corepack prepare pnpm@latest --activate \
#  && pnpm install --prod --frozen-lockfile
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
# Security: non-root
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 \
  && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080

# รันผ่าน Node (มี dist แล้ว)
CMD ["node", "dist/server.js"]
