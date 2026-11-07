// utils/artwork.js
// Apoyo para las ilustraciones de muestra: detecta imágenes de relleno y asigna a cada pieza una atmósfera estable.

// Las imágenes de relleno (placehold.co) se reemplazan por una composición propia. Las fotos reales se usan tal cual.
export function isPlaceholderUrl(url) {
  return typeof url !== "string" || url === "" || url.indexOf("placehold.co") !== -1;
}

// Pares de color (fondo, objeto, acento) tomados de la paleta de Yugen.
const TONES = [
  { a: "#2d1457", b: "#0b0710", o: "#6a43c0", k: "#efe6d2" },
  { a: "#5a0f26", b: "#1a0610", o: "#d9a441", k: "#efe6d2" },
  { a: "#0e1230", b: "#2d1457", o: "#efe6d2", k: "#d4361c" },
  { a: "#14261d", b: "#0b0710", o: "#d9a441", k: "#efe6d2" },
  { a: "#33081a", b: "#0e1230", o: "#c9b8ef", k: "#d9a441" },
  { a: "#3a1a5c", b: "#14261d", o: "#efe6d2", k: "#d4361c" }
];

export function hashText(text) {
  let h = 0;
  const source = String(text || "yugen");
  for (let i = 0; i < source.length; i += 1) {
    h = (h * 31 + source.charCodeAt(i)) % 100003;
  }
  return h;
}

export function toneFor(seed) {
  return TONES[hashText(seed) % TONES.length];
}
