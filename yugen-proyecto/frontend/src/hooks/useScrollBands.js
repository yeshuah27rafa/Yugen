// Líneas de texto que responden al desplazamiento y se detienen al terminar la inercia.
import { useEffect } from "react";

export function useScrollBands(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const rows = Array.from(container.querySelectorAll("[data-speed]"));
    const widths = [];
    const positions = rows.map(() => 0);
    let velocity = 0;
    let lastY = window.scrollY;
    let frame = 0;

    function measure() {
      rows.forEach((row, index) => { widths[index] = row.scrollWidth / 2 || 1; });
    }

    function tick() {
      const y = window.scrollY;
      velocity = velocity * 0.88 + (y - lastY) * 0.12;
      lastY = y;
      if (Math.abs(velocity) < 0.03) velocity = 0;

      if (velocity !== 0) {
        rows.forEach((row, index) => {
          const width = widths[index] || 1;
          positions[index] = (((positions[index] + velocity * Number(row.dataset.speed)) % width) + width) % width;
          row.style.transform = `translate3d(${-positions[index]}px,0,0)`;
        });
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    }

    function onScroll() {
      const currentY = window.scrollY;
      velocity += (currentY - lastY) * 0.12;
      lastY = currentY;
      if (frame === 0) frame = requestAnimationFrame(tick);
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, [containerRef]);
}
