const { PrismaClient, TransactionType } = require('@prisma/client');
const { request, response } = require('../helpers/http');

const prisma = new PrismaClient();

const create = async event => {
  try {
    const {
      body: { user, products }
    } = request(event);

    let items = await prisma.product.findMany({
      where: { id: { in: products.map(p => p.id) } }
    });

    let orderSubtotal = 0;
    let orderTotal = 0;

    items = items.map(item => {
      const product = products.find(p => p.id === item.id);
      const subtotal = product.quantity * item.price;
      const total = subtotal * (1 + item.tax / 100);

      orderSubtotal += subtotal;
      orderTotal += total;

      return {
        productId: item.id,
        tax: item.tax,
        price: item.price,
        quantity: product.quantity,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2)
      };
    });

    const order = await prisma.$transaction(async prisma => {
      const newOrder = await prisma.user.update({
        data: {
          balance: {
            decrement: orderTotal.toFixed(2)
          },
          orders: {
            create: {
              subtotal: orderSubtotal.toFixed(2),
              total: orderTotal.toFixed(2),
              items: {
                create: items
              }
            }
          }
        },
        where: { id: parseInt(user, 10) },
        select: {
          orders: {
            select: { id: true },
            orderBy: { id: 'desc' }
          }
        }
      });

      await prisma.user.update({
        data: {
          transactions: {
            create: {
              type: TransactionType.debit,
              description: `Debit for payment of order #${newOrder.orders[0].id}`,
              amount: orderTotal.toFixed(2)
            }
          }
        },
        where: { id: parseInt(user, 10) }
      });

      return newOrder;
    });

    return response({
      success: true,
      order
    });
  } catch (error) {
    return response(
      {
        success: false,
        error: error?.message
      },
      500
    );
  }
};

module.exports = { create };
