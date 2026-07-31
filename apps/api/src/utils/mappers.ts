import type { MeResponse, OrderDto, ProductDto } from '@delivery-commerce/shared';

export const toUserDto = (user: any): MeResponse => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

export const toProductDto = (product: any): ProductDto => ({
  id: product._id.toString(),
  name: product.name,
  slug: product.slug,
  description: product.description,
  priceCents: product.priceCents,
  inventory: product.inventory,
  isActive: product.isActive,
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),
  ...(product.category ? { category: product.category } : {}),
  ...(product.deliveryFeeCents != null ? { deliveryFeeCents: product.deliveryFeeCents } : {}),
  ...(product.sizes?.length ? { sizes: product.sizes } : {}),
  ...(product.colorVariants?.length
    ? {
        colorVariants: product.colorVariants.map((v: any) => ({
          color: v.color,
          imageUrl: v.imageUrl,
          ...(v.availableSizes?.length ? { availableSizes: v.availableSizes } : {}),
        })),
      }
    : {}),
});

export const toOrderDto = (order: any): OrderDto => ({
  id: order._id.toString(),
  userId: order.userId.toString(),
  status: order.status,
  items: order.items.map((item: any) => ({
    productId: item.productId.toString(),
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
  })),
  totalCents: order.totalCents,
  ...(order.notes ? { notes: order.notes } : {}),
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
});
