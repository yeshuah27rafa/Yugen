// api/client.js
// Única puerta de salida del frontend hacia la API. Centraliza URL, headers y errores.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function apiRequest(path, options = {}) {
  const response = await fetch(API_URL + path, options);
  const data = await response.json();
  if (response.ok === false) {
    throw new Error(data.error || "No pudimos completar la solicitud.");
  }
  return data;
}

export function apiGet(path) {
  return apiRequest(path);
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
