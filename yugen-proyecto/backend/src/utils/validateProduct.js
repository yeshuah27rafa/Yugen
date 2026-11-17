// utils/validateProduct.js
// Valida y normaliza los datos de una pieza antes de guardarla. Devuelve errores legibles en español.
const mongoose = require("mongoose");

const AVAILABILITY = ["en_stock", "agotado", "pedido_exterior"];
const MAX_IMAGES = 8;
const MAX_SPECS = 10;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

// Convierte "Pin Unidad 01" en "pin-unidad-01" y quita acentos.
function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAllowedImage(value) {
  const remote = /^https?:\/\/[^\s]+$/i.test(value);
  const localAsset = /^\/assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..");
  return remote || localAsset;
}

function validateProduct(body) {
  const errors = [];
  const data = {};

  data.name = text(body.name);
  if (data.name === "") errors.push("El nombre es obligatorio.");
  if (data.name.length > 120) errors.push("El nombre no puede superar 120 caracteres.");

  const slugSource = text(body.slug) === "" ? data.name : text(body.slug);
  data.slug = slugify(slugSource);
  if (data.slug === "") errors.push("El enlace (slug) no es válido.");
  if (data.slug.length > 120) errors.push("El enlace (slug) no puede superar 120 caracteres.");

  data.category = text(body.category);
  if (data.category.length > 40 || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.category) === false) errors.push("La categoría no es válida.");

  data.work = text(body.work);
  if (mongoose.isValidObjectId(data.work) === false) errors.push("Selecciona una obra.");

  // Precio vacío significa "consultar": se guarda como null.
  const rawPrice = body.price === null || body.price === undefined ? "" : String(body.price).trim();
  data.price = null;
  if (rawPrice !== "") {
    data.price = Number(rawPrice);
    if (Number.isFinite(data.price) === false || data.price < 0) errors.push("El precio no es válido.");
  }

  const rawStock = body.stock === undefined || body.stock === null || body.stock === "" ? 0 : Number(body.stock);
  data.stock = rawStock;
  if (Number.isInteger(rawStock) === false || rawStock < 0) errors.push("El stock debe ser un número entero mayor o igual a cero.");

  data.availability = text(body.availability) === "" ? "en_stock" : text(body.availability);
  if (AVAILABILITY.includes(data.availability) === false) errors.push("La disponibilidad no es válida.");

  data.description = text(body.description);
  if (data.description.length > 2000) errors.push("La descripción es demasiado larga.");

  data.contexto = text(body.contexto);
  if (data.contexto.length > 1200) errors.push("La ficha contextual no puede superar 1200 caracteres.");

  data.featured = body.featured === true || body.featured === "true";
  data.recommended = body.recommended === true || body.recommended === "true";
  const featuredOrder = body.featuredOrder === undefined || body.featuredOrder === "" ? 0 : Number(body.featuredOrder);
  const recommendedOrder = body.recommendedOrder === undefined || body.recommendedOrder === "" ? 0 : Number(body.recommendedOrder);
  data.featuredOrder = featuredOrder;
  data.recommendedOrder = recommendedOrder;
  if (!Number.isInteger(featuredOrder) || featuredOrder < 0 || featuredOrder > 9999) errors.push("El orden del Hero debe ser un entero entre 0 y 9999.");
  if (!Number.isInteger(recommendedOrder) || recommendedOrder < 0 || recommendedOrder > 9999) errors.push("El orden de recomendaciones debe ser un entero entre 0 y 9999.");

  // Imágenes: admiten URL http(s) o ruta pública local segura de /assets/. Solo una puede ser principal.
  const rawImages = Array.isArray(body.images) ? body.images : [];
  const images = [];
  rawImages.forEach((image) => {
    const url = text(image && image.url);
    const alt = text(image && image.alt);
    if (url === "" && alt === "") return;
    if (isAllowedImage(url) === false) {
      errors.push("Una imagen debe usar una URL http(s) o una ruta local segura dentro de /assets/.");
      return;
    }
    images.push({ url, alt, isMain: image.isMain === true });
  });
  if (images.length > MAX_IMAGES) errors.push(`Una pieza puede tener como máximo ${MAX_IMAGES} imágenes.`);
  let mainIndex = images.findIndex((image) => image.isMain === true);
  if (mainIndex === -1 && images.length > 0) mainIndex = 0;
  data.images = images.map((image, index) => ({ url: image.url, alt: image.alt, isMain: index === mainIndex }));

  // Características: se ignoran filas vacías; si una fila tiene solo una parte, es un error.
  const rawSpecs = Array.isArray(body.specs) ? body.specs : [];
  const specs = [];
  rawSpecs.forEach((spec) => {
    const label = text(spec && spec.label);
    const value = text(spec && spec.value);
    if (label === "" && value === "") return;
    if (label === "" || value === "") {
      errors.push("Cada característica necesita nombre y valor.");
      return;
    }
    specs.push({ label, value });
  });
  if (specs.length > MAX_SPECS) errors.push(`Una pieza puede tener como máximo ${MAX_SPECS} características.`);
  data.specs = specs;

  return { errors, data };
}

module.exports = validateProduct;
