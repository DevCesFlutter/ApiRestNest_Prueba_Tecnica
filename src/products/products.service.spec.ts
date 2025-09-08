import { ProductsService } from './products.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductsService (unit)', () => {
  let service: ProductsService;
  const mockPrisma: any = {
    product: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
  };

  beforeEach(() => {
    // instantiate service directly with mocked prisma
    service = new ProductsService(mockPrisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns data structure', async () => {
    const res = await service.findAll(1, 10, undefined);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('total');
    expect(res).toHaveProperty('page');
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
  });

  it('update throws ConflictException when version mismatches', async () => {
    // arrange: found product has version 2
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 1, version: 2 });

    // act/assert
    await expect(
      service.update(1, { name: 'X' } as any, 1),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
