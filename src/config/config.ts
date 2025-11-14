import dotenv from 'dotenv';

dotenv.config(); 

interface EnvConfig {
  PORT: number; 
  DB_URL: string;
  NODE_ENV: string;
  FILE_SERVER_URL: string;
  PUBLIC_URL: string;
  CORS_ORIGIN: string;
  
  // Room config
  ROOM_TTL_HOURS: number;
  ROOM_MAX_CAPACITY: number;
  
  // Rate limiting
  RATE_LIMIT_MESSAGES_PER_MINUTE: number;
  RATE_LIMIT_ROOM_CREATE_PER_HOUR: number;
  
  // Message config
  MAX_MESSAGE_LENGTH: number;
  MAX_FILE_SIZE_MB: number;
}

export const config: EnvConfig = {
  PORT: Number(process.env.PORT) || 8080,
  DB_URL: process.env.DATABASE_URL as string,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FILE_SERVER_URL: process.env.FILE_SERVER_URL || 'http://localhost:6969',
  PUBLIC_URL: process.env.PUBLIC_URL || 'http://localhost:6969',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  ROOM_TTL_HOURS: Number(process.env.ROOM_TTL_HOURS) || 24,
  ROOM_MAX_CAPACITY: Number(process.env.ROOM_MAX_CAPACITY) || 50,
  
  RATE_LIMIT_MESSAGES_PER_MINUTE: Number(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE) || 10,
  RATE_LIMIT_ROOM_CREATE_PER_HOUR: Number(process.env.RATE_LIMIT_ROOM_CREATE_PER_HOUR) || 20,
  
  MAX_MESSAGE_LENGTH: Number(process.env.MAX_MESSAGE_LENGTH) || 2000,
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 10,
};

export default config;