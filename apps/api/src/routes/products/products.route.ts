import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { productsQuerySchema } from '@delivery-commerce/shared';

import { asyncHandler } from '../../lib/async-handler';
import { HttpError } from '../../lib/http-error';
import { validateRequest } from '../../middleware/validate';
import { ProductModel } from '../../models/product.model';
import { toProductDto } from '../../utils/mappers';
import { productSlugParamsSchema } from './products.schemas';

export const productsRouter = Router();

productsRouter.get(
  '/',
  validateRequest({ query: productsQuerySchema }),
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const filter = search
      ? { isActive: true, name: { $regex: search, $options: 'i' } }
      : { isActive: true };
    const products = await ProductModel.find(filter).sort({ createdAt: -1 }).lean();

    res.status(StatusCodes.OK).json({
      items: products.map((product) => toProductDto(product)),
    });
  }),
);

productsRouter.get(
  '/:slug',
  validateRequest({ params: productSlugParamsSchema }),
  asyncHandler(async (req, res) => {
    const product = await ProductModel.findOne({ slug: req.params.slug, isActive: true }).lean();

    if (!product) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    res.status(StatusCodes.OK).json({ item: toProductDto(product) });
  }),
);
