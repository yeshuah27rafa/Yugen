// app.js
// Lógica del frontend. Se reutiliza en las tres páginas y cada bloque se activa según su elemento.

// ---------- 1. Configuración y utilidades ----------
const API_URL = "http://localhost:4000/api";

// Escapa texto que viene de la base de datos antes de insertarlo como HTML.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

// Formatea el precio en dólares con dos decimales.
function formatPrice(value) {
  return "$" + Number(value).toFixed(2);
}

// Envoltorio de fetch: convierte errores del servidor en excepciones con mensaje legible.
async function request(path, options = {}) {
  const response = await fetch(API_URL + path, options);
  const data = await response.json();
  if (response.ok === false) {
    throw new Error(data.error || "Algo salió mal. Intenta de nuevo.");
  }
  return data;
}

// ---------- 2. Portada y catálogo ----------
let currentCategory = "";

// Plantilla de tarjeta: enlaza a la página de detalle con el id del producto.
function productCard(product) {
  const soldOut = product.stock === 0;
  const tag = soldOut ? '<span class="tag">Agotado</span>' : "";
  return `
    <a class="card" href="producto.html?id=${escapeHtml(product._id)}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div class="card-body">
        <p class="card-meta">${escapeHtml(product.anime || product.category)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="card-price">${formatPrice(product.price)}${tag}</p>
      </div>
    </a>`;
}

// Pide productos según la categoría activa y el texto de búsqueda.
async function loadProducts() {
  const grid = document.getElementById("grid");
  const params = new URLSearchParams();
  const search = document.getElementById("search").value.trim();
  if (currentCategory !== "") params.set("category", currentCategory);
  if (search !== "") params.set("q", search);

  grid.innerHTML = '<p class="status">Cargando productos…</p>';
  try {
    const products = await request("/products?" + params.toString());
    grid.innerHTML = products.length === 0
      ? '<p class="status">No encontramos piezas con esa búsqueda. Prueba otra palabra.</p>'
      : products.map(productCard).join("");
  } catch (error) {
    grid.innerHTML = '<p class="status error">No pudimos cargar el catálogo. Revisa que el servidor esté encendido.</p>';
  }
}

// Conecta filtros, buscador y formulario de contacto de la portada.
function initHome() {
  loadProducts();

  document.querySelectorAll(".pill").forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      document.querySelectorAll(".pill").forEach((other) => {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      loadProducts();
    });
  });

  document.getElementById("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    loadProducts();
  });

  document.getElementById("contact-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const status = document.getElementById("contact-status");
    const body = { name: form.name.value, email: form.email.value, message: form.message.value };
    try {
      await request("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      form.reset();
      status.textContent = "Mensaje enviado. Te respondemos pronto.";
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

// ---------- 3. Detalle de producto ----------
// Lee ?id= de la URL y muestra el producto correspondiente.
async function loadDetail() {
  const box = document.getElementById("detail");
  const id = new URLSearchParams(window.location.search).get("id");
  if (id === null || id === "") {
    box.innerHTML = '<p class="status error">Producto no encontrado.</p>';
    return;
  }
  try {
    const p = await request("/products/" + encodeURIComponent(id));
    const stockText = p.stock > 0
      ? `<p class="stock-ok">Disponible: ${p.stock} en stock</p>`
      : '<p class="stock-out">Agotado por ahora</p>';
    box.innerHTML = `
      <div class="detail-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"></div>
      <div class="detail-info">
        <p class="serie">${escapeHtml(p.anime || p.category)}</p>
        <h1>${escapeHtml(p.name)}</h1>
        <p class="price">${formatPrice(p.price)}</p>
        ${stockText}
        <p>${escapeHtml(p.description)}</p>
        <p><a class="back-link" href="index.html#contacto">Pedir esta pieza →</a></p>
      </div>`;
  } catch (error) {
    box.innerHTML = `<p class="status error">${escapeHtml(error.message)}</p>`;
  }
}

// ---------- 4. Administración ----------
// Muestra login o panel según exista un token guardado en la sesión del navegador.
function refreshAdminView() {
  const loggedIn = sessionStorage.getItem("adminToken") !== null;
  document.getElementById("admin-login").hidden = loggedIn;
  document.getElementById("admin-panel").hidden = loggedIn === false;
}

function initAdmin() {
  refreshAdminView();

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const status = document.getElementById("login-status");
    try {
      const data = await request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.value, password: form.password.value })
      });
      sessionStorage.setItem("adminToken", data.token);
      form.reset();
      refreshAdminView();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem("adminToken");
    refreshAdminView();
  });

  document.getElementById("product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    const status = document.getElementById("product-status");
    const body = {
      name: form.name.value,
      category: form.category.value,
      anime: form.anime.value,
      price: Number(form.price.value),
      stock: Number(form.stock.value),
      image: form.image.value,
      description: form.description.value
    };
    try {
      await request("/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionStorage.getItem("adminToken")
        },
        body: JSON.stringify(body)
      });
      form.reset();
      form.stock.value = "0";
      status.textContent = "Producto guardado. Ya aparece en la tienda.";
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

// ---------- 5. Arranque por página ----------
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("grid")) initHome();
  if (document.getElementById("detail")) loadDetail();
  if (document.getElementById("admin-login")) initAdmin();
});
