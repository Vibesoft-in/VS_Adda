import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantMiddleware } from '../../middleware/tenant.js';
import { requirePerm } from '../../middleware/rbac.js';
import { LibraryService } from './library.service.js';
import { AppError } from '../../middleware/error.js';

export const libraryRouter = Router();

// Apply auth & tenant context to all library routes
libraryRouter.use(authenticate, tenantMiddleware);

// --- 1. MEDIA ASSETS ---
libraryRouter.get('/library/assets', async (req, res, next) => {
  try {
    const brandId = req.query.brandId as string;
    const starred = req.query.starred === 'true' ? true : req.query.starred === 'false' ? false : undefined;
    const kind = req.query.kind as string;
    const search = req.query.search as string;
    const sort = req.query.sort as any;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 40;

    const result = await LibraryService.listAssets(req.ctx!, {
      brandId,
      starred,
      kind,
      search,
      sort,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

libraryRouter.post(
  '/library/assets',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { brandId, title, kind, url, thumbUrl, tags, width, height, bytes } = req.body;
      if (!brandId || !title || !url) {
        throw new AppError('VALIDATION_ERROR', 'brandId, title, and url are required', 400);
      }

      const asset = await LibraryService.createAsset(req.ctx!, {
        brandId,
        title,
        kind: kind || 'IMAGE',
        url,
        thumbUrl,
        tags,
        width,
        height,
        bytes: bytes || 1024,
      });
      res.status(201).json(asset);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.patch(
  '/library/assets/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { title, starred, tags } = req.body;
      const updated = await LibraryService.updateAsset(req.ctx!, req.params.id, {
        title,
        starred,
        tags,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.delete(
  '/library/assets/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      await LibraryService.deleteAsset(req.ctx!, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// --- 2. TEMPLATES ---
libraryRouter.get('/library/templates', async (req, res, next) => {
  try {
    const brandId = req.query.brandId as string;
    const templates = await LibraryService.listTemplates(req.ctx!, brandId);
    res.json({ templates });
  } catch (err) {
    next(err);
  }
});

libraryRouter.post(
  '/library/templates',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { title, body, brandId } = req.body;
      if (!title || !body) {
        throw new AppError('VALIDATION_ERROR', 'title and body are required', 400);
      }

      const template = await LibraryService.createTemplate(req.ctx!, {
        title,
        body,
        brandId,
      });
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.patch(
  '/library/templates/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { title, body } = req.body;
      const updated = await LibraryService.updateTemplate(req.ctx!, req.params.id, {
        title,
        body,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.delete(
  '/library/templates/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      await LibraryService.deleteTemplate(req.ctx!, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// --- 3. HASHTAG SETS ---
libraryRouter.get('/library/hashtags', async (req, res, next) => {
  try {
    const brandId = req.query.brandId as string;
    const sets = await LibraryService.listHashtagSets(req.ctx!, brandId);
    res.json({ sets });
  } catch (err) {
    next(err);
  }
});

libraryRouter.post(
  '/library/hashtags',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { brandId, name, tags } = req.body;
      if (!brandId || !name || !tags) {
        throw new AppError('VALIDATION_ERROR', 'brandId, name, and tags are required', 400);
      }

      const set = await LibraryService.createHashtagSet(req.ctx!, {
        brandId,
        name,
        tags,
      });
      res.status(201).json(set);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.patch(
  '/library/hashtags/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { name, tags } = req.body;
      const updated = await LibraryService.updateHashtagSet(req.ctx!, req.params.id, {
        name,
        tags,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.delete(
  '/library/hashtags/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      await LibraryService.deleteHashtagSet(req.ctx!, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// --- 4. SAVED REPLIES ---
libraryRouter.get('/library/replies', async (req, res, next) => {
  try {
    const replies = await LibraryService.listSavedReplies(req.ctx!);
    res.json({ replies });
  } catch (err) {
    next(err);
  }
});

libraryRouter.post(
  '/library/replies',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { title, body } = req.body;
      if (!title || !body) {
        throw new AppError('VALIDATION_ERROR', 'title and body are required', 400);
      }

      const reply = await LibraryService.createSavedReply(req.ctx!, { title, body });
      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.patch(
  '/library/replies/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      const { title, body } = req.body;
      const updated = await LibraryService.updateSavedReply(req.ctx!, req.params.id, {
        title,
        body,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

libraryRouter.delete(
  '/library/replies/:id',
  requirePerm('library.manage'),
  async (req, res, next) => {
    try {
      await LibraryService.deleteSavedReply(req.ctx!, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
