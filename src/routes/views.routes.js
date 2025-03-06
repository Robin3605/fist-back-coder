import { Router } from "express";
import mongoose from "mongoose";
import __dirname from "../utils.js";
import { Product } from "../models/products.model.js";
import { Cart } from "../models/cart.model.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    let sortOptions = {};
    if (sort === "asc") {
      sortOptions = { price: 1 };
    } else if (sort === "desc") {
      sortOptions = { price: -1 };
    }

    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sortOptions,
      lean: true,
    };

    const filter = {};

    if (query) {
      if (query === "available") {
        filter.status = true;
      } else {
        filter.category = query;
      }
    }

    const result = await Product.paginate(filter, options);

    console.log("Resultados obtenidos:", result.docs.length);
    console.log("Límite aplicado:", options.limit);

    res.render("home", {
      products: result.docs,
      pagination: {
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        limit: options.limit,
        sort,
        query,
        prevLink: result.hasPrevPage
          ? `/?limit=${limit}&page=${result.prevPage}&sort=${
              sort || ""
            }&query=${query || ""}`
          : null,
        nextLink: result.hasNextPage
          ? `/?limit=${limit}&page=${result.nextPage}&sort=${
              sort || ""
            }&query=${query || ""}`
          : null,
      },
    });
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

    if (!mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(404).json({ message: "ID no válido" });
    }

    const product = await Product.findById(pid).lean();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.render("productDetail", { product });
  } catch (error) {
    console.error("Error en la ruta products/:pid:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/carts/:cid", async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid)
      .populate("products.product")
      .lean();

    if (!cart) {
      return res
        .status(404)
        .render("error", { message: "Carrito no encontrado" });
    }

    res.render("cart", {
      cart,
    });
  } catch (error) {
    res.status(404).render("error", { message: "Carrito no encontrado" });
  }
});

router.get("/cart", async (req, res) => {
  try {
    let cart = await Cart.findOne({ active: true });
    if (!cart) {
      cart = await Cart.create({ products: [], active: true });
    }

    res.redirect(`/carts/${cart._id}`);
  } catch (error) {
    res
      .status(500)
      .render("error", { message: "Error al obtener el carrito activo" });
  }
});

export default router;
