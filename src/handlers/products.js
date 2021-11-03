const { PrismaClient } = require('@prisma/client');
const { request, response } = require('../helpers/http');

const prisma = new PrismaClient();

const list = async event => {
  try {
    const products = await prisma.product.findMany();

    return response({
      success: true,
      products
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

const create = async event => {
  try {
    const {
      body: { name, description, image, tax, price }
    } = request(event);

    const product = await prisma.product.create({
      data: { name, description, image, tax, price }
    });

    return response(
      {
        success: true,
        product
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

module.exports = { create, list };
