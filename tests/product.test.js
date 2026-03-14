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
const productController = require("../src/controllers/productController");

// ─── APP DE PRUEBA ────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.post("/api/products", productController.createProduct);
app.get("/api/products", productController.getProducts);

// ─── TESTS ────────────────────────────────────────────────────────────────────
describe("Product Controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/products", () => {

    test("crea un producto correctamente", async () => {
      const mockProduct = { id: 1, name: "Laptop", price: 3500000, stock: 5 };
      prisma.product.create.mockResolvedValue(mockProduct);

      const res = await request(app)
        .post("/api/products")
        .send({ name: "Laptop", price: 3500000, stock: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
    });

    test("retorna 500 si Prisma falla al crear", async () => {
      prisma.product.create.mockRejectedValue(new Error("DB error"));

      const res = await request(app)
        .post("/api/products")
        .send({ name: "Laptop", price: 3500000, stock: 5 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Error creando producto" });
    });

    test("llama a prisma.product.create con los datos correctos", async () => {
      prisma.product.create.mockResolvedValue({});

      await request(app)
        .post("/api/products")
        .send({ name: "Mouse", price: 85000, stock: 20 });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: { name: "Mouse", price: 85000, stock: 20 },
      });
    });
  });

  describe("GET /api/products", () => {

    test("retorna lista de productos", async () => {
      const mockProducts = [
        { id: 1, name: "Laptop", price: 3500000, stock: 5 },
        { id: 2, name: "Mouse",  price: 85000,   stock: 20 },
      ];
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe("Laptop");
    });

    test("retorna lista vacía si no hay productos", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("retorna 500 si Prisma falla al obtener productos", async () => {
      prisma.product.findMany.mockRejectedValue(new Error("DB error"));

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "Error obteniendo productos" });
    });
  });
});