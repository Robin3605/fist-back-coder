import { Router } from "express";
import fs from "fs";
import path from "path";
import __dirname from "../utils.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const productsData = await fs.promises.readFile(
      path.join(__dirname, "../products.json"),
      "utf-8"
    );
    const products = JSON.parse(productsData);
    res.render("home", { products });
  } catch (error) {
    console.error("Error en la ruta home:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/realtimeproducts", async (req, res) => {
  try {
    const productsData = await fs.promises.readFile(
      path.join(__dirname, "../products.json"),
      "utf-8"
    );
    const products = JSON.parse(productsData);
    res.render("realTimeProducts", { products });
  } catch (error) {
    console.error("Error en la ruta realTimeProducts:", error);
    res.status(500).send("Error interno del servidor");
  }
});

export default router;
