import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const productsData = await fs.promises.readFile("products.json", "utf-8");
    const products = JSON.parse(productsData);
    res.send(products);
  } catch (error) {
    console.log("Error in get all products method in products route: ", error);
    res
      .status(500)
      .send(
        "Internal Server Error, Error in get all products method in products route"
      );
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const productsData = await fs.promises.readFile("products.json", "utf-8");
    const products = JSON.parse(productsData);
    const product = products.find((product) => product.id.toString() === pid);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.send(product);
  } catch (error) {
    console.log("Error in get one product method in products route: ", error);
    res
      .status(500)
      .send(
        "Internal Server Error, Error in get one product method in products route"
      );
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, code, price, stock, category, thumbnails } =
      req.body;
    const productsFilePath = path.join("../products.json");
    if (!fs.existsSync(productsFilePath)) {
      fs.writeFileSync(productsFilePath, "[]");
    }
    if (!title || !description || !code || !price || !stock || !category) {
      return res.status(400).send("All fields except thumbnails are required.");
    }
    const productsData = await fs.promises.readFile(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);
    const newProduct = {
      id: products.length + 1,
      title,
      description,
      code,
      price,
      stock,
      category,
      thumbnails: thumbnails || [],
    };
    products.push(newProduct);
    await fs.promises.writeFile(
      productsFilePath,
      JSON.stringify(products, null, 2)
    );

    req.io.emit("realTimeProducts", products); 
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
    const { pid } = req.params;
    const { title, description, code, price, stock, category, thumbnails } =
      req.body;
    const productsFilePath = path.join("products.json");
    const productsData = await fs.promises.readFile(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);
    const productIndex = products.findIndex(
      (product) => product.id.toString() === pid.toString()
    );
    if (productIndex === -1) {
      return res.status(404).send("Product not found.");
    }
    const updatedProduct = {
      ...products[productIndex],
      title: title || products[productIndex].title,
      description: description || products[productIndex].description,
      code: code || products[productIndex].code,
      price: price || products[productIndex].price,
      stock: stock || products[productIndex].stock,
      category: category || products[productIndex].category,
      thumbnails: thumbnails || products[productIndex].thumbnails,
    };
    products[productIndex] = updatedProduct;
    await fs.promises.writeFile(
      productsFilePath,
      JSON.stringify(products, null, 2)
    );
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
    const { pid } = req.params;
    const productsFilePath = path.join("../products.json");
    const productsData = await fs.promises.readFile(productsFilePath, "utf-8");
    const products = JSON.parse(productsData);
    const productIndex = products.findIndex(
      (product) => product.id.toString() === pid.toString()
    );
    if (productIndex === -1) {
      return res.status(404).send("Product not found.");
    }
    products.splice(productIndex, 1);
    await fs.promises.writeFile(
      productsFilePath,
      JSON.stringify(products, null, 2)
    );

    req.io.emit("realTimeProducts", products); 
    res.send("Producto eliminado correctamente");
  } catch (error) {
    console.log("Error in delete method in products route: ", error);
    res
      .status(500)
      .send("Internal Server Error, Error in delete method in products route");
  }
});

export default router;
