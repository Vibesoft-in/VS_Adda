import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { TargetStatus, PostStatus } from '@prisma/client';

export async function handlePublishTarget(payload: { targetId: string; postId: string }) {
  const { targetId, postId } = payload;

  const target = await prisma.postTarget.findUnique({
    where: { id: targetId },
    include: {
      post: true,
      channel: true,
    },
  });

  if (!target) {
    logger.warn({ targetId }, 'Target not found for publishTarget job');
    return;
  }

  // If already published, skip
  if (target.status === TargetStatus.PUBLISHED) {
    return;
  }

  // Update target to PUBLISHING
  await prisma.postTarget.update({
    where: { id: targetId },
    data: {
      status: TargetStatus.PUBLISHING,
      attempts: { increment: 1 },
    },
  });

  try {
    // Check channel eligibility
    if (!target.channel.postingEnabled) {
      throw new Error('Channel posting is currently paused');
    }

    if (target.channel.status === 'DISCONNECTED') {
      throw new Error('Channel is disconnected');
    }

    // In mock mode / adapter, publish successfully
    const externalPostId = `mock_${target.channel.network.toLowerCase()}_${Date.now()}`;
    const now = new Date();

    // Mark target as PUBLISHED
    await prisma.postTarget.update({
      where: { id: targetId },
      data: {
        status: TargetStatus.PUBLISHED,
        externalPostId,
        publishedAt: now,
        lastError: null,
        metrics: {
          impressions: Math.floor(Math.random() * 2000) + 150,
          reach: Math.floor(Math.random() * 1400) + 100,
          likes: Math.floor(Math.random() * 120) + 10,
          comments: Math.floor(Math.random() * 15) + 1,
          shares: Math.floor(Math.random() * 8),
          saves: Math.floor(Math.random() * 12),
          clicks: Math.floor(Math.random() * 45),
        },
      },
    });

    logger.info({ targetId, externalPostId, network: target.channel.network }, 'Target published successfully');
  } catch (err: any) {
    logger.error({ targetId, err: err.message }, 'Failed to publish target');
    await prisma.postTarget.update({
      where: { id: targetId },
      data: {
        status: TargetStatus.FAILED,
        lastError: err.message,
      },
    });
  }

  // Check overall parent Post completion
  const allTargets = await prisma.postTarget.findMany({
    where: { postId },
  });

  const pending = allTargets.filter(
    (t) => t.status === TargetStatus.QUEUED || t.status === TargetStatus.PUBLISHING
  );

  if (pending.length === 0) {
    // All targets have reached a terminal state
    const publishedCount = allTargets.filter((t) => t.status === TargetStatus.PUBLISHED).length;
    const failedCount = allTargets.filter((t) => t.status === TargetStatus.FAILED).length;

    let finalStatus: PostStatus = PostStatus.PUBLISHED;
    let partialFailure = false;

    if (publishedCount === 0 && failedCount > 0) {
      finalStatus = PostStatus.FAILED;
    } else if (failedCount > 0) {
      partialFailure = true;
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: finalStatus,
        partialFailure,
        publishedAt: finalStatus === PostStatus.PUBLISHED ? new Date() : undefined,
      },
    });

    logger.info({ postId, finalStatus, partialFailure }, 'Post lifecycle completed');
  }
}
