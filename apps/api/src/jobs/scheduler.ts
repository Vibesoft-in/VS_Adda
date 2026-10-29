import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { JobQueue } from './queue.js';
import { PostStatus, JobStatus } from '@prisma/client';

export class Scheduler {
  /**
   * Run a single tick of the post scheduler:
   * 1. Detect posts due for publication (SCHEDULED and scheduledAt <= NOW())
   * 2. Flip status to PUBLISHING
   * 3. Enqueue publishTarget jobs for each target
   * 4. Recover stuck RUNNING jobs older than 10 minutes
   */
  static async tick(): Promise<{ duePostsCount: number; enqueuedTargetsCount: number }> {
    const now = new Date();

    // 1. Recover stale RUNNING jobs
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
    const staleRecovered = await prisma.job.updateMany({
      where: {
        status: JobStatus.RUNNING,
        lockedAt: { lt: tenMinutesAgo },
      },
      data: {
        status: JobStatus.QUEUED,
        lockedAt: null,
      },
    });

    if (staleRecovered.count > 0) {
      logger.warn({ count: staleRecovered.count }, 'Recovered stale RUNNING jobs');
    }

    // 2. Find due posts
    const duePosts = await prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      include: {
        targets: true,
      },
      take: 50,
    });

    if (duePosts.length === 0) {
      return { duePostsCount: 0, enqueuedTargetsCount: 0 };
    }

    let enqueuedCount = 0;

    for (const post of duePosts) {
      // Transition to PUBLISHING
      await prisma.post.update({
        where: { id: post.id },
        data: { status: PostStatus.PUBLISHING },
      });

      // Enqueue job per target
      for (const target of post.targets) {
        await JobQueue.enqueue(
          'publishTarget',
          { targetId: target.id, postId: post.id },
          {
            dedupeKey: `target:${target.id}:attempt:${target.attempts + 1}`,
          }
        );
        enqueuedCount++;
      }
    }

    logger.info({ duePostsCount: duePosts.length, enqueuedCount }, 'Scheduler tick processed due posts');
    return { duePostsCount: duePosts.length, enqueuedTargetsCount: enqueuedCount };
  }
}
