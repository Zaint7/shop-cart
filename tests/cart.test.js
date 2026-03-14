const request = require("supertest");
const express = require("express");

// ─── MOCK DE PRISMA ───────────────────────────────────────────────────────────
jest.mock("../src/database/prismaClient", () => {
  return {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    cart: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };
});

const prisma = require("../src/database/prismaClient");
const cartController = require("../src/controllers/cartController");

// ─── APP DE PRUEBA ────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.get("/api/cart", cartController.getCart);
app.delete("/api/cart/:id", cartController.removeFromCart);
app.post("/api/cart", cartController.addToCart);

// ─── TESTS ────────────────────────────────────────────────────────────────────
describe("Cart Controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCart ────────────────────────────────────────────────────────────────
  describe("GET /api/cart", () => {

    test("retorna items y total correctamente", async () => {
      const mockItems = [
        { id: 1, quantity: 2, product: { price: 100000 } },
        { id: 2, quantity: 1, product: { price: 50000  } },
      ];
      prisma.cart.findMany.mockResolvedValue(mockItems);

      const res = await request(app).get("/api/cart");

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(250000);
    });

    test("retorna total 0 si el carrito está vacío", async () => {
      prisma.cart.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/cart");

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    test("retorna 500 si Prisma falla", async () => {
      prisma.cart.findMany.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/cart");

      expect(res.status).toBe(500);
    });
  });

  // ── removeFromCart ─────────────────────────────────────────────────────────
  describe("DELETE /api/cart/:id", () => {

    test("elimina un item correctamente", async () => {
      prisma.cart.delete.mockResolvedValue({});

      const res = await request(app).delete("/api/cart/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });

    test("llama a prisma.cart.delete con el id correcto", async () => {
      prisma.cart.delete.mockResolvedValue({});

      await request(app).delete("/api/cart/5");

      expect(prisma.cart.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    test("retorna 500 si Prisma falla al eliminar", async () => {
      prisma.cart.delete.mockRejectedValue(new Error("DB error"));

      const res = await request(app).delete("/api/cart/1");

      expect(res.status).toBe(500);
    });
  });

  // ── addToCart ──────────────────────────────────────────────────────────────
  describe("POST /api/cart", () => {

    test("agrega un item al carrito correctamente", async () => {
      const mockItem = { id: 1, productId: 2, quantity: 3 };
      prisma.cart.create.mockResolvedValue(mockItem);

      const res = await request(app)
        .post("/api/cart")
        .send({ productId: 2, quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockItem);
    });

    test("llama a prisma.cart.create con los datos correctos", async () => {
      prisma.cart.create.mockResolvedValue({});

      await request(app)
        .post("/api/cart")
        .send({ productId: 2, quantity: 3 });

      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { productId: 2, quantity: 3 },
      });
    });
  });
});