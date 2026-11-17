// seed.js
// Inicializa categorías y asegura obras/productos de muestra sin sobrescribir contenido administrado.
const Work = require("./models/Work");
const Product = require("./models/Product");
const CatalogCategory = require("./models/CatalogCategory");

const DEFAULT_CATEGORIES = [
  { slug: "pin", name: "Pines", description: "Esmalte, metal y pequeños detalles.", kanji: "ピン", seed: "Lain", sortOrder: 10, active: true, showOnHome: true },
  { slug: "manga", name: "Mangas", description: "Ediciones y volúmenes de las obras.", kanji: "漫画", seed: "Akira", sortOrder: 20, active: true, showOnHome: true },
  { slug: "figura", name: "Figuras", description: "Personajes en formato coleccionable.", kanji: "人形", seed: "Violet", sortOrder: 30, active: true, showOnHome: true },
  { slug: "mousepad", name: "Mousepads", description: "Piezas para el escritorio.", kanji: "盤", seed: "Perfect Blue", sortOrder: 40, active: true, showOnHome: true },
  { slug: "otro", name: "Otros", description: "Otras formas de conservar una obra.", kanji: "作品", seed: "Yugen", sortOrder: 50, active: true, showOnHome: false }
];

const SAMPLE_WORKS = [
  { title: "Perfect Blue", slug: "perfect-blue", year: 1997, synopsis: "Una mirada sobre la identidad, la imagen pública y la frontera cada vez más tenue entre lo que se muestra y lo que se vive.", cover: "/assets/yugen-samples/works/perfect-blue.svg", sortOrder: 10 },
  { title: "Neon Genesis Evangelion", slug: "evangelion", year: 1995, synopsis: "Un universo de símbolos, tensión y preguntas íntimas que conviven con una escala monumental.", cover: "/assets/yugen-samples/works/evangelion.svg", sortOrder: 20 },
  { title: "Serial Experiments Lain", slug: "lain", year: 1998, synopsis: "Tecnología, percepción y conexión en una atmósfera introspectiva que sigue resonando.", cover: "/assets/yugen-samples/works/lain.svg", sortOrder: 30 },
  { title: "Violet Evergarden", slug: "violet-evergarden", year: 2018, synopsis: "Sensibilidad, memoria y lenguaje: una historia que encuentra belleza en aquello que cuesta poner en palabras.", cover: "/assets/yugen-samples/works/violet-evergarden.svg", sortOrder: 40 }
];

const SAMPLE_PRODUCTS = [
  { name: "Pin Unidad 01", slug: "pin-unidad-01", category: "pin", workSlug: "evangelion", price: 6.5, stock: 12, featured: true, featuredOrder: 10, recommendedOrder: 0, recommended: false, availability: "en_stock", description: "Pin esmaltado de muestra inspirado en el imaginario visual de Evangelion.", contexto: "Una referencia visual a la imaginería de Evangelion, pensada como un objeto pequeño de colección.", image: "/assets/yugen-samples/products/pin-unidad-01.svg" },
  { name: "Figura Mima", slug: "figura-mima", category: "figura", workSlug: "perfect-blue", price: 38, stock: 0, featured: true, featuredOrder: 20, recommendedOrder: 0, recommended: false, availability: "agotado", description: "Figura de muestra vinculada a la obra Perfect Blue.", contexto: "Una pieza para quienes conectan con el retrato de la identidad y la imagen pública que atraviesa Perfect Blue.", image: "/assets/yugen-samples/products/figura-mima.svg" },
  { name: "Mousepad Lain", slug: "mousepad-lain", category: "mousepad", workSlug: "lain", price: 14, stock: 5, featured: true, featuredOrder: 30, recommendedOrder: 0, recommended: false, availability: "en_stock", description: "Mousepad de muestra con una composición inspirada en el lenguaje visual de Serial Experiments Lain.", contexto: "Una composición para el escritorio que recoge la atmósfera tecnológica e introspectiva de Serial Experiments Lain.", image: "/assets/yugen-samples/products/mousepad-lain.svg" },
  { name: "Manga Violet, vol. 1", slug: "manga-violet-vol-1", category: "manga", workSlug: "violet-evergarden", price: 12, stock: 3, featured: false, featuredOrder: 0, recommendedOrder: 10, recommended: true, availability: "pedido_exterior", description: "Volumen de muestra para acercarse a Violet Evergarden en formato impreso.", contexto: "Una edición para volver al universo narrativo de Violet Evergarden desde la lectura.", image: "/assets/yugen-samples/products/manga-violet-vol-1.svg" },
  { name: "Llavero Violet", slug: "llavero-violet", category: "otro", workSlug: "violet-evergarden", price: null, stock: 4, featured: false, featuredOrder: 0, recommendedOrder: 20, recommended: true, availability: "en_stock", description: "Llavero de muestra vinculado a la obra Violet Evergarden.", contexto: "Un objeto pequeño para llevar cerca una referencia visual de Violet Evergarden.", image: "/assets/yugen-samples/products/llavero-violet.svg" }
];

module.exports = async function seedIfEmpty() {
  await Promise.all(DEFAULT_CATEGORIES.map((category) => CatalogCategory.updateOne(
    { slug: category.slug }, { $setOnInsert: category }, { upsert: true }
  )));

  // Migra registros anteriores al campo recommended sin alterar selecciones ya administradas.
  // Los productos de muestra reciben grupos distintos para evitar repetir el Hero en Recomendaciones.
  const recommendationBySample = new Map(SAMPLE_PRODUCTS.map((item) => [item.slug, item.recommended]));
  for (const sample of SAMPLE_PRODUCTS) {
    const current = await Product.findOne({ slug: sample.slug }).select("_id createdAt updatedAt recommended");
    const untouched = current && current.createdAt && current.updatedAt
      && new Date(current.createdAt).getTime() === new Date(current.updatedAt).getTime();
    if (untouched && current.recommended !== sample.recommended) {
      await Product.updateOne({ _id: current._id }, { $set: { recommended: sample.recommended } });
    }
  }
  const legacyProducts = await Product.find({ recommended: { $exists: false } }).select("_id slug");
  for (const product of legacyProducts) {
    await Product.updateOne({ _id: product._id }, { $set: { recommended: recommendationBySample.get(product.slug) === true } });
  }

  const workBySlug = {};
  for (const work of SAMPLE_WORKS) {
    await Work.updateOne({ slug: work.slug }, { $setOnInsert: work }, { upsert: true });
    let current = await Work.findOne({ slug: work.slug });
    const missingFields = {};
    if (!current.synopsis) missingFields.synopsis = work.synopsis;
    if (!current.cover) missingFields.cover = work.cover;
    if (!Number.isInteger(current.sortOrder) || current.sortOrder === 0) missingFields.sortOrder = work.sortOrder;
    if (Object.keys(missingFields).length) {
      await Work.updateOne({ _id: current._id }, { $set: missingFields });
      current = await Work.findById(current._id);
    }
    workBySlug[work.slug] = current._id;
  }

  // Los productos de muestra faltantes se agregan también cuando la base ya contiene inventario real.
  // Los slugs son estables: no se duplican y jamás se sobrescribe una pieza editada desde el panel.
  for (const sample of SAMPLE_PRODUCTS) {
    const existing = await Product.findOne({ slug: sample.slug });
    const payload = {
      name: sample.name,
      slug: sample.slug,
      category: sample.category,
      work: workBySlug[sample.workSlug],
      price: sample.price,
      stock: sample.stock,
      availability: sample.availability,
      featured: sample.featured,
      featuredOrder: sample.featuredOrder,
      recommended: sample.recommended,
      recommendedOrder: sample.recommendedOrder,
      description: sample.description,
      contexto: sample.contexto,
      images: [{ url: sample.image, alt: sample.name, isMain: true }]
    };
    if (!existing) {
      await Product.create(payload);
    } else {
      const currentImage = existing.images && existing.images[0] ? existing.images[0].url : "";
      const missingFields = {};
      if (currentImage.includes("placehold.co") || currentImage === "") missingFields.images = payload.images;
      if (!existing.description) missingFields.description = sample.description;
      if (!existing.contexto) missingFields.contexto = sample.contexto;
      if (!Number.isInteger(existing.featuredOrder)) missingFields.featuredOrder = sample.featuredOrder;
      if (!Number.isInteger(existing.recommendedOrder)) missingFields.recommendedOrder = sample.recommendedOrder;
      if (Object.keys(missingFields).length) await Product.updateOne({ _id: existing._id }, { $set: missingFields });
    }
  }
  console.log("Categorías, obras y piezas de muestra verificadas.");
};
