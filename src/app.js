import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import handlebars from "express-handlebars";
import __dirname from "./utils.js";
import productsRouter from "./routes/products.route.js";
import cartsRouter from "./routes/carts.route.js";
import viewsRouter from "./routes/views.routes.js";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 8080;

// Configuración de Handlebars
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '/public')));

// Crear servidor HTTP y Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer);

// Pasar `io` a las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);

// Escuchar conexiones de Socket.IO
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  // Escuchar eventos para agregar o eliminar productos
  socket.on("realTimeProducts", async (product) => {
    try {
      const productsFilePath = path.join(__dirname, "../products.json");
      const productsData = await fs.promises.readFile(
        productsFilePath,
        "utf-8"
      );
      const products = JSON.parse(productsData);
      const newProduct = {
        id: products.length + 1,
        ...product,
      };
      products.push(newProduct);
      await fs.promises.writeFile(
        productsFilePath,
        JSON.stringify(products, null, 2)
      );
      io.emit("realTimeProducts", products);
      socket.emit("loadProducts", products); // Emitir la lista completa de productos
    } catch (error) {
      console.log("Error al agregar producto:", error);
    }
  });

  socket.on("deleteProduct", async (productId) => {
    try {
      const productsFilePath = path.join(__dirname, "../products.json");
      const productsData = await fs.promises.readFile(
        productsFilePath,
        "utf-8"
      );
      const products = JSON.parse(productsData);
      const productIndex = products.findIndex(
        (product) => product.id.toString() === productId.toString()
      );
      if (productIndex === -1) {
        return;
      }
      products.splice(productIndex, 1);
      await fs.promises.writeFile(
        productsFilePath,
        JSON.stringify(products, null, 2)
      );
      io.emit("realTimeProducts", products);
      io.emit("loadProducts", products); 
    } catch (error) {
      console.log("Error al eliminar producto:", error);
    }
  });
});


httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
