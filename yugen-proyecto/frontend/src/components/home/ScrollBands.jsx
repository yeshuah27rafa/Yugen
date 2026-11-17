// components/home/ScrollBands.jsx
// Tres líneas horizontales con velocidades distintas, ligadas al scroll real. Son decorativas.
import { useRef } from "react";
import { useScrollBands } from "../../hooks/useScrollBands.js";

const KANJI = "電脳   夢   青   都   魔   紫   狩   奇   ";

export default function ScrollBands({ works, categories }) {
  const ref = useRef(null);
  useScrollBands(ref);
  const titles = works.status === "ready" && works.data.length > 0
    ? works.data.map((w) => w.title).join("   ✦   ") + "   ✦   "
    : "Serial Experiments Lain   ✦   Perfect Blue   ✦   Evangelion   ✦   Akira   ✦   Paprika   ✦   Madoka   ✦   ";
  const cats = categories.status === "ready" && categories.data.length > 0
    ? categories.data.map((item) => item.name).join(" — ") + " — Piezas elegidas por una razón — "
    : "Pines — Mangas — Figuras — Mousepads — Piezas elegidas por una razón — ";
  const rep = (text) => text + text + text + text;
  return (
    <section className="bands" ref={ref} aria-hidden="true">
      <div className="bands__row bands__row--a" data-speed="1.5">{rep(titles)}</div>
      <div className="bands__row bands__row--b" data-speed="-3">{rep(cats)}</div>
      <div className="bands__row bands__row--c" data-speed="0.7" lang="ja">{rep(KANJI)}</div>
    </section>
  );
}
