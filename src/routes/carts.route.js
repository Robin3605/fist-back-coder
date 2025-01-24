import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const cartsFilePath = path.join("carts.json");
    const cartsData = await fs.promises.readFile(cartsFilePath, "utf-8");
    const carts = JSON.parse(cartsData);
    const cart = carts.find((cart) => cart.id.toString() === cid);
    if (!cart) {
      return res.status(404).send("Cart not found");
    }
    res.send(cart.products);
  } catch (error) {
    console.log("Error in get products in cart method: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in get products in cart method");
  }
});

router.post("/", async (req, res) => {
  try {
    const { products } = req.body;
    const cartsFilePath = path.join("carts.json");
    if (!fs.existsSync(cartsFilePath)) {
      fs.writeFileSync(cartsFilePath, "[]");
    }
    const cartsData = await fs.promises.readFile(cartsFilePath, "utf-8");
    const carts = JSON.parse(cartsData);
    const newCart = {
      id: carts.length + 1,
      products: products || [],
    };
    carts.push(newCart);
    await fs.promises.writeFile(cartsFilePath, JSON.stringify(carts, null, 2));
    res.send(newCart);
  } catch (error) {
    console.log("Error in post method in carts route: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in post method in carts route");
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const cartsFilePath = path.join("carts.json");
    const cartsData = await fs.promises.readFile(cartsFilePath, "utf-8");
    const carts = JSON.parse(cartsData);
    const cartIndex = carts.findIndex((cart) => cart.id.toString() === cid);
    if (cartIndex === -1) {
      return res.status(404).send("Cart not found");
    }
    const productIndex = carts[cartIndex].products.findIndex(
      (product) => product.product.toString() === pid
    );
    if (productIndex !== -1) {
      carts[cartIndex].products[productIndex].quantity += 1;
    } else {
      carts[cartIndex].products.push({ product: pid, quantity: 1 });
    }
    await fs.promises.writeFile(cartsFilePath, JSON.stringify(carts, null, 2));
    res.send(carts[cartIndex]);
  } catch (error) {
    console.log("Error in post product to cart method: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in post product to cart method");
  }
});

export default router;
