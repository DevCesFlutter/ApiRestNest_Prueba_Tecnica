import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
      return await this.prismaService.product.create({
        data: createProductDto,
      });
    } catch (error: any) {
      // Prisma client errors may come from a different runtime instance; check code string
      if (error && error.code === 'P2002') {
        const target = (error.meta && (error.meta.target as string[])) || [];
        const field = target[0] || 'campo único';
        const value = (createProductDto as any)[field] ?? createProductDto.name;
        throw new ConflictException(
          `El producto con ${field} '${value}' ya existe`,
        );
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sort?: string,
    order: 'asc' | 'desc' = 'asc',
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // allow only certain sort fields to avoid SQL injection-like issues
    const allowedSortFields = ['price', 'stock', 'name', 'updatedAt'];
    let orderBy: Prisma.ProductOrderByWithRelationInput | undefined = undefined;
    if (sort && allowedSortFields.includes(sort)) {
      // Prisma expects camelCase field names; assume incoming sort matches model
      orderBy = { [sort]: order } as any;
    }

    const [products, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prismaService.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const productFound = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!productFound) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }
    return productFound;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    version: number,
  ) {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Producto con id ${id} no encontrado`);
      }

      if (product.version !== version) {
        throw new ConflictException(
          'El producto fue modificado por otro usuario',
        );
      }

      return await this.prismaService.product.update({
        where: { id },
        data: {
          ...updateProductDto,
          version: version + 1,
        },
      });
    } catch (error: any) {
      if (error instanceof ConflictException) {
        // Manejo específco del 409
        throw new ConflictException(
          'Conflicto: otro usuario modificó este producto antes que tú.',
        );
      }

      // check Prisma error codes by property to avoid instanceof issues
      if (error && error.code === 'P2002') {
        const target = (error.meta && (error.meta.target as string[])) || [];
        const field = target[0] || 'campo único';
        throw new ConflictException(
          `Conflicto: el ${field} ya existe en otro producto`,
        );
      }

      if (error && error.code === 'P2025') {
        const product = await this.prismaService.product.findUnique({
          where: { id },
        });
        if (product) {
          throw new ConflictException(
            'El producto fue modificado por otro usuario',
          );
        }
        throw new NotFoundException(`Producto con id ${id} no encontrado`);
      }

      throw error; // Resto de errores
    }
  }

  async remove(id: number, version: number) {
    try {
      // Validar versión antes de borrar
      const product = await this.prismaService.product.findUnique({
        where: { id },
      });
      if (!product)
        throw new NotFoundException(`Producto con id ${id} no encontrado`);
      if (product.version !== version) {
        throw new ConflictException(
          'El producto fue modificado por otro usuario',
        );
      }
      return await this.prismaService.product.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          const product = await this.prismaService.product.findUnique({
            where: { id },
          });
          if (product) {
            throw new ConflictException(
              'El producto fue modificado por otro usuario',
            );
          }
          throw new NotFoundException(`Producto con id ${id} no encontrado`);
        }
      }
      throw error;
    }
  }
}
