import { NextRequest, NextResponse } from "next/server";

const upstreamBase =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3333";

async function proxy(request: NextRequest, method: string, path: string[]) {
  const url = new URL(request.url);
  const target = new URL(`${upstreamBase}/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (key.toLowerCase() === "host") continue;
    headers.set(key, value);
  }

  const init: RequestInit = {
    method,
    headers
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  const body = await response.text();

  const outHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) outHeaders.set("content-type", contentType);

  return new NextResponse(body, {
    status: response.status,
    headers: outHeaders
  });
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, "GET", context.params.path || []);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, "POST", context.params.path || []);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, "PUT", context.params.path || []);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, "PATCH", context.params.path || []);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, "DELETE", context.params.path || []);
}
