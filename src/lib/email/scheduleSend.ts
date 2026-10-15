import { after } from 'next/server';
import { attemptSendEmailJob } from './outbox';

/**
 * Send after the HTTP response. Must return/await the promise so Next/Vercel
 * keeps the isolate alive until SMTP finishes (voiding the promise drops it).
 */
export function scheduleEmailJobSend(jobId: string): void {
  const run = async () => {
    try {
      await attemptSendEmailJob(jobId);
    } catch (err) {
      console.error(
        '[email:after]',
        err instanceof Error ? err.message : 'send failed'
      );
    }
  };

  try {
    after(async () => {
      await run();
    });
  } catch {
    // Fallback when after() is unavailable in this context
    void run();
  }
}
