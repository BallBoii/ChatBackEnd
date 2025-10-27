import roomService from '@/services/RoomService';
import sessionService from '@/services/SessionService';

/**
 * Cleanup job to remove expired rooms and inactive sessions
 * Run this periodically (e.g., via cron job or setInterval)
 */
export async function runCleanup() {
  console.log('[Cleanup] Starting cleanup job...');

  try {
    // Clean expired rooms
    const expiredRooms = await roomService.cleanupExpiredRooms();
    console.log(`[Cleanup] Removed ${expiredRooms} expired rooms`);

    // Clean inactive sessions (inactive for more than 30 minutes)
    const inactiveSessions = await sessionService.cleanupInactiveSessions(30);
    console.log(`[Cleanup] Removed ${inactiveSessions} inactive sessions`);

    console.log('[Cleanup] Cleanup job completed successfully');
  } catch (error) {
    console.error('[Cleanup] Cleanup job failed:', error);
  }
}

/**
 * Start periodic cleanup (every 10 minutes)
 */
export function startCleanupScheduler() {
  const INTERVAL = 10 * 60 * 1000; // 10 minutes

  console.log('[Cleanup] Scheduler started');
  
  // Run immediately on start
  runCleanup();

  // Then run periodically
  setInterval(runCleanup, INTERVAL);
}
