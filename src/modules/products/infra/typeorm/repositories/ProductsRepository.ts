import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({ where: { name } });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const id: string[] = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({
      where: { id: In(In(id).value) },
    });
    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const id: string[] = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({
      where: { id: In(In(id).value) },
    });

    const updatedProducts = findProducts.map(product => {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity:
          product.quantity -
          products[products.findIndex(index => index.id === product.id)]
            .quantity,
        created_at: product.created_at,
        updated_at: product.updated_at,
      };
    }) as Product[];

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
