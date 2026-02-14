const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function resolvePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") return `/api${normalized}`;
  if (API_URL) return `${API_URL}${normalized}`;
  return `http://127.0.0.1:3333${normalized}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const hasBody = typeof init?.body !== "undefined";
  const response = await fetch(resolvePath(path), {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export { API_URL };
