const { PrismaClient, TransactionType } = require('@prisma/client');
const { request, response } = require('../helpers/http');

const prisma = new PrismaClient();

const makeTransfer = async ({ fromUser, toUser, amount }) => {
  return await prisma.$transaction(async prisma => {
    const to = await prisma.user.findUnique({
      where: { id: parseInt(toUser, 10) }
    });

    if (!to) {
      throw new Error("The recipient wasn't found.");
    }

    const sender = await prisma.user.update({
      data: {
        balance: { decrement: amount },
        transactions: {
          create: {
            type: TransactionType.debit,
            description: `You sent money to ${to.name}`,
            amount
          }
        }
      },
      where: { id: parseInt(fromUser, 10) }
    });

    if (sender.balance < 0) {
      throw new Error(`${sender.name} doesn't have enough balance`);
    }

    const receipt = await prisma.user.update({
      data: {
        balance: { increment: amount },
        transactions: {
          create: {
            type: TransactionType.credit,
            description: `You received money from ${sender.name}`,
            amount
          }
        }
      },
      where: { id: parseInt(toUser, 10) }
    });

    return receipt;
  });
};

const addBalance = async ({ user, amount }) => {
  return await prisma.user.update({
    data: {
      balance: { increment: amount },
      transactions: {
        create: {
          type: TransactionType.credit,
          description: 'New deposit to your balance',
          amount
        }
      }
    },
    where: {
      id: parseInt(user, 10)
    }
  });
};

const create = async event => {
  try {
    const {
      body,
      params: { type }
    } = request(event);

    let trx;

    switch (type) {
      case 'balance':
        trx = await addBalance(body);
        break;
      case 'transfer':
        trx = await makeTransfer(body);
        console.log(trx);
        break;
      default:
        return response(
          {
            success: false,
            error: `${type} is a transaction type invalid`
          },
          400
        );
    }

    return response(
      {
        success: true,
        transaction: trx
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

module.exports = { create };
