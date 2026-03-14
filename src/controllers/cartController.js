const prisma = require('../database/prismaClient');


exports.getCart = async (req, res) => {

  const items = await prisma.cart.findMany({
    include: {
      product: true
    }
  });

  let total = 0;

  items.forEach(item => {
    total += item.product.price * item.quantity;
  });

  res.json({
    items,
    total
  });

};

exports.removeFromCart = async (req, res) => {

  const id = Number(req.params.id);

  await prisma.cart.delete({
    where: { id: id }
  });

  res.json({ success: true });

};

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const item = await prisma.cart.create({
    data: {
      productId: Number(productId),
      quantity: Number(quantity)
    }
  });
  res.json(item);
};