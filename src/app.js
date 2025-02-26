import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import handlebars from "express-handlebars";
import __dirname from "./utils.js";
import productsRouter from "./routes/products.route.js";
import cartsRouter from "./routes/carts.route.js";
import viewsRouter from "./routes/views.routes.js";
import { connectDB } from "./public/js/db.js";
import { Product } from "./models/products.model.js";
import dotenv from "dotenv";
import path from "path";
import methodOverride from "method-override"; 


dotenv.config();

const app = express();
const PORT = 8080;


const hbs = handlebars.create({
  helpers: {
    multiply: (a, b) => a * b, 
    totalCart: (products) =>
      products.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      ), 
  },
});



app.engine("handlebars", hbs.engine);
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

hbs.handlebars.registerHelper('totalCart', function(products) {
  return products.reduce((total, item) => total + (item.product.price * item.quantity), 0);
});

app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "/public")));


const httpServer = createServer(app);
const io = new Server(httpServer);


app.use((req, res, next) => {
  req.io = io;
  next();
});


app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter);


io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  
  socket.on("realTimeProducts", async (product) => {
    try {
      const newProduct = await Product.create({
        title: product.title,
        description: product.description,
        code: product.code,
        price: product.price,
        stock: product.stock,
        category: product.category,
        thumbnails: product.thumbnails || [],
      });
      const products = await Product.find().lean();
      io.emit("realTimeProducts", products);
      socket.emit("loadProducts", products); 
    } catch (error) {
      console.log("Error al agregar producto:", error);
    }
  });

  socket.on("deleteProduct", async (pid) => {
    try {
      
      const deletedProduct = await Product.findByIdAndDelete(pid);
      if (!deletedProduct) {
        return;
      }
      const products = await Product.find().lean();
      io.emit("realTimeProducts", products);
      io.emit("loadProducts", products);
    } catch (error) {
      console.log("Error al eliminar producto:", error);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  connectDB();
});
