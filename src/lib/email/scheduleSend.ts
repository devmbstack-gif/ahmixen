import { after } from 'next/server';
import { attemptSendEmailJob } from './outbox';

/**
 * Fire-and-forget send after the HTTP response. Errors never reach the client.
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
    after(() => {
      void run();
    });
  } catch {
    // Fallback when after() is unavailable in this context
    void run();
  }
}
