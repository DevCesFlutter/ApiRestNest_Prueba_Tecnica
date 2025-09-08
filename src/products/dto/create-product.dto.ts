import { Product } from '@prisma/client';

// Exclude auto-managed fields
export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
