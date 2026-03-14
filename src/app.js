const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const prisma = require('./database/prismaClient');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api", productRoutes);
app.use("/api", cartRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "API TechMercancy funcionando" });
});

// ─── SEED: insertar productos de ejemplo ─────────────────────────────────────
app.post("/api/seed", async (req, res) => {
  try {
    await prisma.product.createMany({
      skipDuplicates: true,
      data: [
        { name: "Laptop Pro 15",        price: 3500000, stock: 5  },
        { name: "Mouse Inalámbrico",    price: 85000,   stock: 20 },
        { name: "Teclado Mecánico",     price: 320000,  stock: 10 },
        { name: "Monitor 4K 27\"",      price: 1450000, stock: 3  },
        { name: "Auriculares RGB",      price: 210000,  stock: 15 },
        { name: "Webcam HD 1080p",      price: 180000,  stock: 8  },
      ]
    });
    res.json({ message: "Productos insertados correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error insertando productos" });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
app.delete("/api/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const deleted = await prisma.product.delete({ where: { id } });
    res.json(deleted);
  } catch (error) {
    console.error("ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── CART ─────────────────────────────────────────────────────────────────────

// Agregar al carrito con validación de stock
app.post("/api/cart", async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // 1. Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // 2. Calcular cuánto hay ya en el carrito
    const existingItems = await prisma.cart.findMany({
      where: { productId: Number(productId) }
    });
    const cantidadEnCarrito = existingItems.reduce((sum, i) => sum + i.quantity, 0);
    const cantidadSolicitada = Number(quantity);

    // 3. Validar stock disponible
    if (cantidadEnCarrito + cantidadSolicitada > product.stock) {
      const disponible = product.stock - cantidadEnCarrito;
      return res.status(400).json({
        error: disponible <= 0
          ? `Sin existencias disponibles de "${product.name}"`
          : `Solo quedan ${disponible} unidad(es) disponibles de "${product.name}"`
      });
    }

    // 4. Si ya existe en el carrito, sumar cantidad
    const itemExistente = existingItems[0];
    if (itemExistente) {
      const updated = await prisma.cart.update({
        where: { id: itemExistente.id },
        data: { quantity: itemExistente.quantity + cantidadSolicitada }
      });
      return res.json(updated);
    }

    // 5. Si no existe, crear nuevo item
    const cartItem = await prisma.cart.create({
      data: {
        productId: Number(productId),
        quantity: cantidadSolicitada
      }
    });

    res.json(cartItem);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error agregando al carrito" });
  }
});

// Ver carrito
app.get("/api/cart", async (req, res) => {
  try {
    const items = await prisma.cart.findMany({
      include: { product: true }
    });

    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo carrito" });
  }
});

// Eliminar del carrito
app.delete("/api/cart/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.cart.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando del carrito" });
  }
});

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
app.get("/api/checkout", async (req, res) => {
  try {
    const cart = await prisma.cart.findMany({
      include: { product: true }
    });

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    res.json({ items: cart, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error calculando checkout" });
  }
});

// ─── SERVER ───────────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});