import { Router } from "express";
import { Product } from "../models/products.model.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";


const router = Router();

router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;

    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    
    let cart = await Cart.findOne({ active: true });
    if (!cart) {
      cart = await Cart.create({ products: [], active: true });
    }

    
    const productObjectId = new mongoose.Types.ObjectId(productId);

    
    const productIndex = cart.products.findIndex(p => p.product.equals(productObjectId));
    if (productIndex !== -1) {
      
      cart.products[productIndex].quantity += 1;
    } else {
      
      cart.products.push({ product: productObjectId, quantity: 1 });
    }

    
    await cart.save();

    
    res.redirect(`/`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const cartId = req.params.cid;

    
    if (!mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({ message: "ID de carrito inválido" });
    }

    
    const cart = await Cart.findById(cartId).populate("products.product");

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.post("/:cid/product/:pid", async (req, res) => {
  try {
    
    const { cid, pid } = req.params;

    
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    
    const productIndex = cart.products.findIndex(
      (p) => p.product.toString() === pid
    );
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += 1; 
    } else {
      cart.products.push({ product: pid, quantity: 1 }); 
    }

    await cart.save();

    res.render("cart", {
      cart,
      
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

    
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Formato de productos inválido" });
    }

    
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

    
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    
    await Cart.findByIdAndDelete(cid);
    
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



export default router;
