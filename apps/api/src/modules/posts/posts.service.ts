import { prisma } from '../../lib/prisma.js';
import { UserContext, PostStatus, requiresApproval } from '@postdesk/shared';
import { AppError } from '../../middleware/error.js';
import { validatePostContent } from '../../lib/validation.js';

export class PostsService {
  static async create(ctx: UserContext, input: any) {
    if (!ctx.allBrands && !ctx.brandIds.includes(input.brandId)) {
      throw new AppError('NOT_FOUND', 'Brand not found or access denied', 404);
    }

    const brand = await prisma.brand.findUnique({
      where: { id: input.brandId },
    });
    if (!brand || brand.workspaceId !== ctx.workspaceId) {
      throw new AppError('NOT_FOUND', 'Brand not found', 404);
    }

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          workspaceId: ctx.workspaceId,
          brandId: input.brandId,
          authorId: ctx.userId,
          campaignId: input.campaignId || null,
          caption: input.caption || '',
          firstComment: input.firstComment || null,
          status: 'DRAFT',
          scheduledAt,
          version: 1,
        },
      });

      // Targets
      if (Array.isArray(input.channelIds)) {
        for (const channelId of input.channelIds) {
          await tx.postTarget.create({
            data: {
              postId: created.id,
              channelId,
              status: 'QUEUED',
            },
          });
        }
      }

      // Media
      if (Array.isArray(input.media)) {
        for (const m of input.media) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              assetId: m.assetId,
              position: m.position,
              altText: m.altText || null,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.created',
          entity: 'Post',
          entityId: created.id,
          brandId: input.brandId,
          meta: { status: 'DRAFT' },
        },
      });

      return created;
    });

    return await this.getById(ctx, post.id);
  }

  static async getById(ctx: UserContext, id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        brand: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            title: true,
          },
        },
        campaign: true,
        media: {
          orderBy: { position: 'asc' },
          include: { asset: true },
        },
        targets: {
          include: {
            channel: true,
          },
        },
        reviews: {
          where: { voided: false },
          orderBy: { at: 'desc' },
        },
      },
    });

    if (!post || post.workspaceId !== ctx.workspaceId || post.deletedAt) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    if (!ctx.allBrands && !ctx.brandIds.includes(post.brandId)) {
      throw new AppError('NOT_FOUND', 'Post not found', 404);
    }

    return post;
  }

  static async update(ctx: UserContext, id: string, input: any) {
    const post = await this.getById(ctx, id);

    // Read-only state check
    if (post.status === 'PUBLISHING' || post.status === 'PUBLISHED') {
      throw new AppError('CONFLICT', 'Published or currently publishing posts cannot be edited', 409);
    }

    // Version check if provided
    if (input.version && input.version !== post.version) {
      throw new AppError('CONFLICT', 'Post content was modified by another user. Please reload.', 409);
    }

    // Determine workspace approval mode
    const workspace = await prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
    });
    const needsApproval = requiresApproval(ctx, workspace?.approvalMode || 'BY_ROLE');

    let newStatus = post.status;
    let bumpedVersion = post.version;
    let auditAction = 'post.updated';

    // Editing rules from 03_LOGIC.md §5
    if (post.status === 'PENDING' || post.status === 'SCHEDULED') {
      if (needsApproval) {
        // Must return to PENDING and require re-approval
        newStatus = 'PENDING';
        bumpedVersion += 1;
        auditAction = 'post.reapproval_required';
      } else {
        // Publisher editing keeps SCHEDULED
        bumpedVersion += 1;
        auditAction = 'post.edited_after_approval';
      }
    }

    const scheduledAt =
      input.scheduledAt !== undefined ? (input.scheduledAt ? new Date(input.scheduledAt) : null) : post.scheduledAt;

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          caption: input.caption !== undefined ? input.caption : post.caption,
          firstComment: input.firstComment !== undefined ? input.firstComment : post.firstComment,
          campaignId: input.campaignId !== undefined ? input.campaignId : post.campaignId,
          scheduledAt,
          status: newStatus as PostStatus,
          version: bumpedVersion,
        },
      });

      // Update channels if provided
      if (Array.isArray(input.channelIds)) {
        await tx.postTarget.deleteMany({ where: { postId: id } });
        for (const chId of input.channelIds) {
          await tx.postTarget.create({
            data: {
              postId: id,
              channelId: chId,
              status: 'QUEUED',
            },
          });
        }
      }

      // Update media if provided
      if (Array.isArray(input.media)) {
        await tx.postMedia.deleteMany({ where: { postId: id } });
        for (const m of input.media) {
          await tx.postMedia.create({
            data: {
              postId: id,
              assetId: m.assetId,
              position: m.position,
              altText: m.altText || null,
            },
          });
        }
      }

      if (newStatus === 'PENDING' && post.status === 'SCHEDULED') {
        await tx.review.create({
          data: {
            postId: id,
            byId: ctx.userId,
            decision: 'SUBMITTED',
            note: 'Content edited after approval - resubmitted for sign-off',
            postVersion: bumpedVersion,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: auditAction,
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
          meta: { previousStatus: post.status, newStatus, version: bumpedVersion },
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async delete(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    // Own-resource rule: author can delete own post. Others need post.delete
    if (post.authorId !== ctx.userId && !ctx.perms.includes('post.delete')) {
      throw new AppError('FORBIDDEN', 'You do not have permission to delete this post', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.deleted',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return { success: true, message: 'Post moved to trash' };
  }

  static async submit(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    if (post.status !== 'DRAFT' && post.status !== 'CHANGES') {
      throw new AppError('CONFLICT', `Cannot submit post with status ${post.status}`, 409);
    }

    // Run validation
    const channels = post.targets.map((t) => ({
      id: t.channel.id,
      network: t.channel.network,
      handle: t.channel.handle,
      status: t.channel.status,
      postingEnabled: t.channel.postingEnabled,
    }));

    const media = post.media.map((m) => ({
      kind: m.asset.kind,
      url: m.asset.url,
    }));

    const issues = validatePostContent({
      caption: post.caption,
      channels,
      media,
      scheduledAt: post.scheduledAt,
      isSubmitting: true,
    });

    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      throw new AppError('VALIDATION', 'Validation failed: ' + errors[0].message, 422, { issues });
    }

    // Check if an eligible approver exists for this brand (03_LOGIC.md §4)
    const approversCount = await prisma.membership.count({
      where: {
        workspaceId: ctx.workspaceId,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN', 'MANAGER', 'CLIENT'] },
        OR: [
          { allBrands: true },
          { brands: { some: { brandId: post.brandId } } },
        ],
      },
    });

    if (approversCount === 0) {
      throw new AppError(
        'NO_APPROVER',
        'No eligible approver exists for this brand. Please ask an administrator to assign a manager or client approver.',
        422
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { status: 'PENDING' },
      });

      await tx.review.create({
        data: {
          postId: id,
          byId: ctx.userId,
          decision: 'SUBMITTED',
          postVersion: post.version,
          note: 'Submitted for sign-off',
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.submitted',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async withdraw(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    if (post.status !== 'PENDING') {
      throw new AppError('CONFLICT', `Cannot withdraw post with status ${post.status}`, 409);
    }

    // Only author or admin can withdraw
    if (post.authorId !== ctx.userId && ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      throw new AppError('FORBIDDEN', 'Only the post author may withdraw a pending submission', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { status: 'DRAFT' },
      });

      await tx.review.create({
        data: {
          postId: id,
          byId: ctx.userId,
          decision: 'WITHDRAWN',
          postVersion: post.version,
          note: 'Submission withdrawn by author',
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.withdrawn',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async schedule(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    const workspace = await prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
    });
    if (requiresApproval(ctx, workspace?.approvalMode || 'BY_ROLE')) {
      throw new AppError('FORBIDDEN', 'Your role requires approval. Please submit for sign-off instead.', 403);
    }

    if (!post.scheduledAt || post.scheduledAt.getTime() < Date.now() + 5 * 60 * 1000) {
      throw new AppError('VALIDATION', 'Scheduling requires a date at least 5 minutes in the future', 422);
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { status: 'SCHEDULED' },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.scheduled',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async publishNow(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    const workspace = await prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
    });
    if (requiresApproval(ctx, workspace?.approvalMode || 'BY_ROLE')) {
      throw new AppError('FORBIDDEN', 'Your role requires approval before publishing.', 403);
    }

    const now = new Date();

    // In mock mode: immediately mark targets published and post published!
    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          scheduledAt: now,
          publishedAt: now,
        },
      });

      for (const t of post.targets) {
        await tx.postTarget.update({
          where: { id: t.id },
          data: {
            status: 'PUBLISHED',
            externalPostId: `ext_live_${id.slice(-6)}_${t.channel.network}`,
            publishedAt: now,
            metrics: {
              impressions: 150,
              reach: 120,
              likes: 14,
              comments: 2,
              shares: 1,
              clicks: 5,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.published_now',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async reschedule(ctx: UserContext, id: string, newDateIso: string) {
    const post = await this.getById(ctx, id);
    const newScheduledAt = new Date(newDateIso);

    if (newScheduledAt.getTime() <= Date.now()) {
      throw new AppError('VALIDATION', 'Scheduled time cannot be in the past', 422);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
    });
    const needsApproval = requiresApproval(ctx, workspace?.approvalMode || 'BY_ROLE');

    let newStatus = post.status;
    let bumpedVersion = post.version;

    // Rescheduling rules from 03_LOGIC.md §5
    if (post.status === 'SCHEDULED' && needsApproval) {
      newStatus = 'PENDING';
      bumpedVersion += 1;
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          scheduledAt: newScheduledAt,
          status: newStatus as PostStatus,
          version: bumpedVersion,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.rescheduled',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
          meta: { previousTime: post.scheduledAt, newTime: newScheduledAt },
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async retry(ctx: UserContext, id: string) {
    const post = await this.getById(ctx, id);

    if (post.status !== 'FAILED') {
      throw new AppError('CONFLICT', `Cannot retry post in status ${post.status}`, 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { status: 'PUBLISHING', partialFailure: false },
      });

      // Re-queue failed targets
      await tx.postTarget.updateMany({
        where: { postId: id, status: 'FAILED' },
        data: { status: 'QUEUED', attempts: 0, lastError: null },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          actorId: ctx.userId,
          action: 'post.retried',
          entity: 'Post',
          entityId: id,
          brandId: post.brandId,
        },
      });
    });

    return await this.getById(ctx, id);
  }

  static async validate(ctx: UserContext, input: any) {
    const channels = await prisma.channel.findMany({
      where: {
        id: { in: input.channelIds || [] },
        workspaceId: ctx.workspaceId,
      },
    });

    const mediaAssets = await prisma.mediaAsset.findMany({
      where: {
        id: { in: input.mediaAssetIds || [] },
        workspaceId: ctx.workspaceId,
      },
    });

    const issues = validatePostContent({
      caption: input.caption || '',
      channels: channels.map((c) => ({
        id: c.id,
        network: c.network,
        handle: c.handle,
        status: c.status,
        postingEnabled: c.postingEnabled,
      })),
      media: mediaAssets.map((m) => ({
        kind: m.kind,
        url: m.url,
      })),
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    });

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }
}
