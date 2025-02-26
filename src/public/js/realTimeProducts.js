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
  const price = parseFloat(document.getElementById("price").value);
  const stock = parseInt(document.getElementById("stock").value);
  const category = document.getElementById("category").value;
  const image = document.getElementById("image").value;

  if (!title || !description || !code || !price || !stock || !category || !image) {
    document.getElementById("producto_estado1").innerText = "Todos los campos son requeridos.";
    return;
}


if (isNaN(price) || isNaN(stock)) {
    document.getElementById("producto_estado1").innerText = "El precio y el stock deben ser números.";
    return;
}

  const product = {
    title,
    description,
    code,
    price,
    stock,
    category,
    thumbnails: [image],
  };

  socket.emit("realTimeProducts", product);

  // Limpiar formulario
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("code").value = "";
  document.getElementById("price").value = "";
  document.getElementById("stock").value = "";
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
    option.value = product._id; // Asegúrate de usar el campo correcto para el ID
    option.text = `# ${product.title}`; // Cambia esto si necesitas mostrar otro campo
    select.appendChild(option); 
  });
});
const eliminarProducto = () => {
  const pid = document.getElementById("product_id").value; // Obtener el ID del select
  if (!pid) {
    document.getElementById("producto_estado2").innerHTML = `
      <div class="alert alert-danger" role="alert">Por favor, selecciona un producto para eliminar.</div>
    `;
    return; // Salir si no hay ID
  }

  socket.emit("deleteProduct", pid); // Emitir el ID correcto

  document.getElementById("producto_estado2").innerHTML = `
    <div class="alert alert-success" role="alert">El producto se eliminó correctamente!</div>
  `;

  setTimeout(() => {
    document.getElementById("producto_estado2").innerHTML = "";
  }, 3000);
};

