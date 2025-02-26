import { Router } from "express";
import { Product } from "../models/products.model.js";
import mongoose from "mongoose";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort ? { price: sort === "asc" ? 1 : -1 } : undefined,
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

    res.status(200).json({
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage
        ? `/api/products?limit=${limit}&page=${result.prevPage}&sort=${
            sort || ""
          }&query=${query || ""}`
        : null,
      nextLink: result.hasNextPage
        ? `/api/products?limit=${limit}&page=${result.nextPage}&sort=${
            sort || ""
          }&query=${query || ""}`
        : null,
    });

    if (!result) {
      return res.status(404).json({ message: "No hay productos" });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;

    
    if (!mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const product = await Product.findById(pid).lean();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, code, price, stock, category, thumbnails } =
      req.body;

    if (!title || !description || !code || !price || !stock || !category) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res
        .status(400)
        .json({ error: "El código ya existe. Por favor, usa otro." });
    }

    const newProduct = await Product.create({
      title,
      description,
      code,
      price: Number(price),
      stock: Number(stock),
      category,
      thumbnails: thumbnails || [],
    });
    await newProduct.save();
    req.io.emit("realTimeProducts", await Product.find().lean());
    res.send(newProduct);
  } catch (error) {
    console.log("Error in post method in products route: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in post method in products route");
  }
});

router.put("/:pid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.pid,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    req.io.emit("realTimeProducts", await Product.find().lean());
    res.send(updatedProduct);
  } catch (error) {
    console.log("Error in put method in products route: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in put method in products route");
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.pid)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const deletedProduct = await Product.findByIdAndDelete(req.params.pid);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    req.io.emit("realTimeProducts", await Product.find().lean());
    res.send("Producto eliminado correctamente");
  } catch (error) {
    console.log("Error in delete method in products route: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in delete method in products route");
  }
});

export default router;
