const prisma = require('../database/prismaClient');

exports.createProduct = async (req, res) => {
  try {
    const { name, price, stock } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock
      }
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: "Error creando producto" });
  }
};

exports.getProducts = async (req, res) => {
  try {

    const products = await prisma.product.findMany();

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
};  