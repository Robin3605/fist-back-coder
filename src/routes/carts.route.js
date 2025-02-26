import { Router } from "express";
import { Product } from "../models/products.model.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";
// import fs from "fs";
// import path from "path";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;

    // Verificar si el producto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Buscar un carrito activo o crear uno nuevo
    let cart = await Cart.findOne({ active: true });
    if (!cart) {
      cart = await Cart.create({ products: [], active: true });
    }

    // Convertir productId a ObjectId para la comparación
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Verificar si el producto ya está en el carrito
    const productIndex = cart.products.findIndex(p => p.product.equals(productObjectId));
    if (productIndex !== -1) {
      // Incrementar la cantidad si el producto ya está en el carrito
      cart.products[productIndex].quantity += 1;
    } else {
      // Agregar el producto si no está en el carrito
      cart.products.push({ product: productObjectId, quantity: 1 });
    }

    // Guardar el carrito actualizado
    await cart.save();

    // res.redirect(`/cart/${cart._id}`);
    res.redirect(`/`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;

    // Verificar si el ID del carrito es válido
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({ message: "ID de carrito inválido" });
    }

    // Obtener el carrito con los productos poblados
    const cart = await Cart.findById(cartId).populate("products.product");

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    // Renderizar la vista del carrito o devolver los datos en JSON
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint para obtener o crear un carrito activo
// router.get("/active", async (req, res) => {
//   try {
//     let cart = await Cart.findOne({ cartId: req.params.cid, active: true });
//     if (!cart) {
//       cart = await Cart.create({
//         cartId: req.params.cid,
//         products: [],
//         active: true,
//       });
//     }
//     res.status(200).json(cart);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    // Validar IDs
    const { cid, pid } = req.params;

    // Verificar si el carrito y el producto existen
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar si el producto ya está en el carrito
    const productIndex = cart.products.findIndex(
      (p) => p.product.toString() === pid
    );
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += 1; // Incrementar la cantidad si ya existe
    } else {
      cart.products.push({ product: pid, quantity: 1 }); // Agregar el producto si no existe
    }

    await cart.save();

    res.render("cart", {
      cart,
      // successMessage: "Producto agregado correctamente",
    });


    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.cid) ||
      !mongoose.Types.ObjectId.isValid(req.params.pid)
    ) {
      return res.status(400).json({ message: "IDs inválidos" });
    }

    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    cart.products = cart.products.filter(
      (p) => p.product.toString() !== req.params.pid
    );

    const updatedCart = await cart.save();
    const populatedCart = await Cart.populate(updatedCart, {
      path: "products.product",
    });

    res.redirect(`/carts/${req.params.cid }`);
    // res.status(200).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:cid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
      return res.status(400).json({ message: "ID de carrito inválido" });
    }

    const { products } = req.body;

    // Validar estructura de productos
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Formato de productos inválido" });
    }

    // Verificar existencia de todos los productos
    for (const item of products) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ message: "ID de producto inválido" });
      }
      const productExists = await Product.exists({ _id: item.product });
      if (!productExists) {
        return res
          .status(404)
          .json({ message: `Producto ${item.product} no encontrado` });
      }
    }

    const cart = await Cart.findByIdAndUpdate(
      req.params.cid,
      { products },
      { new: true, runValidators: true }
    ).populate("products.product");

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.cid) ||
      !mongoose.Types.ObjectId.isValid(req.params.pid)
    ) {
      return res.status(400).json({ message: "IDs inválidos" });
    }

    const { quantity } = req.body;
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const productIndex = cart.products.findIndex(
      (p) => p.product.toString() === req.params.pid
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito" });
    }

    cart.products[productIndex].quantity = quantity;
    const updatedCart = await cart.save();
    const populatedCart = await Cart.populate(updatedCart, {
      path: "products.product",
    });

    res.status(200).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;

    // Verificar si el carrito existe
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    // Eliminar el carrito de la base de datos
    await Cart.findByIdAndDelete(cid);
    // if (!mongoose.Types.ObjectId.isValid(req.params.cid)) {
    //   return res.status(400).json({ message: "ID de carrito inválido" });
    // }

    // const cart = await Cart.findByIdAndUpdate(
    //   req.params.cid,
    //   { products: [] },
    //   { new: true }
    // ).populate("products.product");

    // if (!cart) {
    //   return res.status(404).json({ message: "Carrito no encontrado" });
    // }

    // res.status(200).json(cart);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// router.post("/add-to-cart", async (req, res) => {
//   try {
//     const { productId } = req.body;

//     // Verificar si el producto existe
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ message: "Producto no encontrado" });
//     }

//     // Buscar un carrito activo o crear uno nuevo
//     let cart = await Cart.findOne({ active: true });
//     if (!cart) {
//       cart = await Cart.create({ products: [], active: true });
//     }

//     // Convertir productId a ObjectId para la comparación
//     const productObjectId = new mongoose.Types.ObjectId(productId);

//     // Verificar si el producto ya está en el carrito
//     const productIndex = cart.products.findIndex(p => p.product.equals(productObjectId));
//     if (productIndex !== -1) {
//       // Incrementar la cantidad si el producto ya está en el carrito
//       cart.products[productIndex].quantity += 1;
//     } else {
//       // Agregar el producto si no está en el carrito
//       cart.products.push({ product: productObjectId, quantity: 1 });
//     }

//     // Guardar el carrito actualizado
//     await cart.save();

//     // res.redirect(`/cart/${cart._id}`);
//     res.redirect(`/`); // Redirigir a la página del carrito
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

export default router;
