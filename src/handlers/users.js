const { PrismaClient, TransactionType } = require('@prisma/client');
const { request, response } = require('../helpers/http');

const prisma = new PrismaClient();

const list = async event => {
  try {
    const users = await prisma.user.findMany();

    return response({
      success: true,
      users
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

const get = async event => {
  try {
    const {
      params: { userId, collection, orderId }
    } = request(event);

    const result = { success: true };

    const query = prisma.user.findUnique({
      where: { id: parseInt(userId, 10) }
    });

    switch (collection) {
      case 'orders':
        if (orderId) {
          result.order = await query.orders({
            where: { id: parseInt(orderId, 10) }
          });
        } else {
          result.orders = await query.orders();
        }
        break;
      case 'transactions':
        result.transactions = await query.transactions();
        break;
      default:
        result.user = await query;
        break;
    }

    return response(result);
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

const create = async event => {
  try {
    const {
      body: { name, email, balance }
    } = request(event);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        balance,
        transactions: {
          create: {
            type: TransactionType.credit,
            description: 'New deposit to your balance',
            amount: balance || 0
          }
        }
      }
    });

    return response(
      {
        success: true,
        user
      },
      201
    );
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

module.exports = { create, get, list };
