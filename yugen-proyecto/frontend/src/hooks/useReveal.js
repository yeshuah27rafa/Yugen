// Gestiona las entradas y salidas de los elementos [data-reveal].
// Observa también nodos añadidos después del primer render (por ejemplo, respuestas de la API).
import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supportsObserver = typeof IntersectionObserver !== "undefined";
    if (reduce || !supportsObserver) {
      document.querySelectorAll("[data-reveal]").forEach((node) => node.classList.add("is-in"));
      return undefined;
    }

    const observed = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // No se desconecta al entrar: al salir vuelve al estado inicial y se anima al regresar.
        entry.target.classList.toggle("is-in", entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: "-4% 0px -6% 0px" });

    function observe(root) {
      if (root.matches?.("[data-reveal]") && !observed.has(root)) {
        observed.add(root);
        observer.observe(root);
      }
      root.querySelectorAll?.("[data-reveal]").forEach((node) => {
        if (!observed.has(node)) {
          observed.add(node);
          observer.observe(node);
        }
      });
    }

    observe(document);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) observe(node);
      }));
    });
    mutations.observe(document.querySelector("#root") || document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);
}
