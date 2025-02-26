import { Router } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import __dirname from "../utils.js";
import { Product } from "../models/products.model.js";
import { Cart } from "../models/cart.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort ? { price: sort === "asc" ? 1 : -1 } : undefined,
      lean: true
    };

    const filter = query ? { category: query } : {};

    const result = await Product.paginate(filter, options);

    // Debug: Verificar resultados
    console.log("Resultados obtenidos:", result.docs.length);
    console.log("Límite aplicado:", options.limit);

    res.render("home", {
      products: result.docs, // Solo los docs de la página actual
      pagination: {
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        limit: options.limit,
        sort,
        query
      }
    });
    // res.render("home", { products });
  } catch (error) {
    console.error("Error en la ruta home:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    res.render("realTimeProducts", { products });
  } catch (error) {
    console.error("Error en la ruta realTimeProducts:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/products/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    // Verificar si el parámetro es un ID de MongoDB válido
    if (!mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(404).json({ message: "ID no válido" });
    }

    // Buscar el producto por ID de MongoDB
    const product = await Product.findById(pid).lean();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Renderizar la vista de detalles del producto
    res.render("productDetail", { product });
  } catch (error) {
    console.error("Error en la ruta products/:pid:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// Nueva ruta para vista de carrito
router.get("/carts/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid)
      .populate("products.product")
      .lean();

    if (!cart) {
      return res.status(404).render("error", { message: "Carrito no encontrado" });
    }

    res.render("cart", {
      cart,
      // style: "cart.css",
    });
  } catch (error) {
    res.status(404).render("error", { message: "Carrito no encontrado" });
  }
});

// Ruta para mostrar el carrito activo
router.get("/cart", async (req, res) => {
  try {
    // Buscar un carrito activo o crear uno nuevo
    let cart = await Cart.findOne({ active: true });
    if (!cart) {
      cart = await Cart.create({ products: [], active: true });
    }

    // Redirigir al usuario a la vista del carrito activo
    res.redirect(`/carts/${cart._id}`);
  } catch (error) {
    res.status(500).render("error", { message: "Error al obtener el carrito activo" });
  }
});

export default router;
