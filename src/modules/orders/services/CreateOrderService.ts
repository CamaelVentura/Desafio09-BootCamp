import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';

import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer is not valid');
    }

    const findProducts = await this.productsRepository.findAllById(products);

    if (findProducts.length === 0) {
      throw new AppError('This products are not valid', 400);
    }

    findProducts.filter(
      findProduct =>
        findProduct.quantity >
        products[products.findIndex(product => product.id === findProduct.id)]
          .quantity,
    );

    const orderProducts = findProducts.map(product => {
      return {
        product_id: product.id,
        price: product.price,
        quantity:
          products[
            products.findIndex(
              quantityProduct => quantityProduct.id === product.id,
            )
          ].quantity,
      };
    });

    const availableProducts = orderProducts.filter(
      orderedProducts =>
        orderedProducts.quantity <=
        findProducts[
          findProducts.findIndex(
            quantityProduct =>
              quantityProduct.id === orderedProducts.product_id,
          )
        ].quantity,
    );

    if (availableProducts.length === 0) {
      throw new AppError('No valid quantities', 400);
    }

    const updateQuantity = availableProducts.map(product => {
      return {
        id: product.product_id,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(updateQuantity);

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
