import { ProductsController } from './products.controller';
import { BadRequestException } from '@nestjs/common';

describe('ProductsController (unit)', () => {
  const mockService: any = {
    findAll: jest
      .fn()
      .mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 1 }),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  let controller: ProductsController;

  beforeEach(() => {
    controller = new ProductsController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll calls service.findAll', async () => {
    const res = await controller.findAll(1, 10, undefined);
    expect(mockService.findAll).toHaveBeenCalledWith(
      1,
      10,
      undefined,
      undefined,
      undefined,
    );
    expect(res).toHaveProperty('data');
  });

  it('update without If-Match header throws BadRequestException', async () => {
    await expect(
      // @ts-ignore invoke with missing version header
      controller.update('1', { name: 'X' } as any, undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
