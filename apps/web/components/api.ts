const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const hasBody = typeof init?.body !== "undefined";
  const response = await fetch(`${API_URL}${path}`, {
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
