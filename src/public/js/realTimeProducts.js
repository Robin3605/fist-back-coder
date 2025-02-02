const socket = io();

socket.on("realTimeProducts", (products) => {
  const content = document.getElementById("content");
  content.innerHTML = ""; // Limpiar lista

  products.forEach((product) => {
    const productHTML = `
      <div class="col-md-3">
        <div class="card text-center border-0 fw-light" style="height: 100%;">
          <img src="${product.thumbnails[0]}" class="card-img-top img-fluid" style="height: 150px; object-fit: cover;" alt="${product.title}">
          <div class="card-body">
            <p class="card-text">${product.title}</p>
            <p class="card-text">$${product.price}</p>
          </div>
        </div>
      </div>
    `;
    content.innerHTML += productHTML;
  });
});

const agregarProducto = () => {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const code = document.getElementById("code").value;
  const price = document.getElementById("price").value;
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").value;

  const product = {
    title,
    description,
    code,
    price,
    category,
    thumbnails: [image],
  };

  socket.emit("realTimeProducts", product);

  // Limpiar formulario
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("code").value = "";
  document.getElementById("price").value = "";
  document.getElementById("category").value = "";
  document.getElementById("image").value = "";

  document.getElementById("producto_estado1").innerHTML = `
    <div class="alert alert-success" role="alert">El producto se agregó correctamente!</div>
  `;

  setTimeout(() => {
    document.getElementById("producto_estado1").innerHTML = "";
  }, 3000);
};

socket.on("loadProducts", (products) => {
  const select = document.getElementById("product_id");
  select.innerHTML = ""; // Limpiar el select antes de agregar opciones
  products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id; // Asignar el ID del producto
    option.text = `Producto ${product.id}`; 
    select.appendChild(option); 
  });
});
const eliminarProducto = (id) => {
  const productId = document.getElementById("product_id").value;
  socket.emit("deleteProduct", productId);

  document.getElementById("producto_estado2").innerHTML = `
    <div class="alert alert-success" role="alert">El producto se eliminó correctamente!</div>
  `;

  setTimeout(() => {
    document.getElementById("producto_estado2").innerHTML = "";
  }, 3000);

  return productos.filter(producto => producto.id !== id);

};

