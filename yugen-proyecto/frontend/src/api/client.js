// api/client.js
// Única puerta de salida del frontend hacia la API. Centraliza URL, headers y errores.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(API_URL + path, options);
  } catch (networkError) {
    const error = new Error("No pudimos conectar con el servidor. Intenta de nuevo en un momento.");
    error.status = 0;
    throw error;
  }
  const data = await response.json();
  if (response.ok === false) {
    const error = new Error(data.error || "No pudimos completar la solicitud.");
    error.status = response.status;
    throw error;
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
