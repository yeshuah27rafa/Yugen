// seed.js
// Carga obras y productos de ejemplo solo si la base está vacía.
// Las fichas contextuales quedan vacías a propósito: no se inventan significados.
const Work = require("./models/Work");
const Product = require("./models/Product");

const SAMPLE_WORKS = [
  { title: "Perfect Blue", slug: "perfect-blue", year: 1997 },
  { title: "Neon Genesis Evangelion", slug: "evangelion", year: 1995 },
  { title: "Serial Experiments Lain", slug: "lain", year: 1998 },
  { title: "Violet Evergarden", slug: "violet-evergarden", year: 2018 }
];

const SAMPLE_PRODUCTS = [
  { name: "Pin Unidad 01", slug: "pin-unidad-01", category: "pin", workSlug: "evangelion", price: 6.5, stock: 12, featured: true, availability: "en_stock", color: "1F2A44" },
  { name: "Figura Mima", slug: "figura-mima", category: "figura", workSlug: "perfect-blue", price: 38, stock: 0, featured: true, availability: "agotado", color: "8B1E2B" },
  { name: "Mousepad Lain", slug: "mousepad-lain", category: "mousepad", workSlug: "lain", price: 14, stock: 5, featured: true, availability: "en_stock", color: "D9A441" },
  { name: "Manga Violet, vol. 1", slug: "manga-violet-vol-1", category: "manga", workSlug: "violet-evergarden", price: 12, stock: 3, featured: false, availability: "pedido_exterior", color: "1F2A44" }
];

module.exports = async function seedIfEmpty() {
  const total = await Product.countDocuments();
  if (total > 0) return;

  const works = await Work.insertMany(SAMPLE_WORKS);
  const workIdBySlug = {};
  works.forEach((work) => { workIdBySlug[work.slug] = work._id; });

  const products = SAMPLE_PRODUCTS.map((item) => ({
    name: item.name,
    slug: item.slug,
    category: item.category,
    work: workIdBySlug[item.workSlug],
    price: item.price,
    stock: item.stock,
    availability: item.availability,
    featured: item.featured,
    description: "",
    contexto: "",
    images: [{ url: `https://placehold.co/800x1000/${item.color}/F4EBD9?text=${encodeURIComponent(item.name)}`, alt: item.name, isMain: true }]
  }));
  await Product.insertMany(products);
  console.log("Catálogo de ejemplo cargado.");
};
