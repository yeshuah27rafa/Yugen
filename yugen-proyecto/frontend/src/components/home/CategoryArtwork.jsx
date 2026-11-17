import { useEffect, useState } from "react";
import PieceArt from "../art/PieceArt.jsx";

export default function CategoryArtwork({ category }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [category.imageUrl]);
  if (category.imageUrl && !failed) {
    return <img className="cat__art" src={category.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
  }
  return <PieceArt category={category.slug} seed={category.seed || category.name} className="cat__art" />;
}
