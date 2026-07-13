import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.HOSPITAL_API_URL || "http://localhost:3000").replace(/\/+$/, "");

function buildUpstreamUrl(path: string[] | undefined, search: string) {
  const pathString = path?.length ? path.join("/") : "";
  return `${API_BASE_URL}/${pathString}${search || ""}`;
}
function buildHeaders(req: NextRequest) {
  const headers = new Headers();
  for (const key of ["content-type", "accept", "authorization", "cookie", "x-request-id"]) {
    const value = req.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("x-forwarded-host", req.headers.get("host") || req.nextUrl.host);
  return headers;
}
type ProxyCtx = { params: { path: string[] } } | { params: Promise<{ path: string[] }> };
async function proxy(method: string, req: NextRequest, ctx: ProxyCtx) {
  const { path } = await Promise.resolve(ctx.params);
  const init: RequestInit = { method, headers: buildHeaders(req), cache: "no-store" };
  if (method !== "GET" && method !== "HEAD") init.body = await req.arrayBuffer();
  try {
    const upstream = await fetch(buildUpstreamUrl(path, req.nextUrl.search), init);
    const body = await upstream.arrayBuffer();
    const responseHeaders: Record<string, string> = { "content-type": upstream.headers.get("content-type") || "application/json", "cache-control": "no-store" };
    const contentDisposition = upstream.headers.get("content-disposition");
    if (contentDisposition) responseHeaders["content-disposition"] = contentDisposition;
    const res = new NextResponse(body, { status: upstream.status, headers: responseHeaders });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) setCookie.split(/,(?=\s*[^;]+?=)/).forEach((c) => res.headers.append("set-cookie", c.trim()));
    return res;
  } catch (error: any) {
    return NextResponse.json({ message: "API hôpital indisponible", detail: error?.message ?? "Erreur réseau", upstream: API_BASE_URL }, { status: 502 });
  }
}
export async function GET(req: NextRequest, ctx: ProxyCtx) { return proxy("GET", req, ctx); }
export async function POST(req: NextRequest, ctx: ProxyCtx) { return proxy("POST", req, ctx); }
export async function PUT(req: NextRequest, ctx: ProxyCtx) { return proxy("PUT", req, ctx); }
export async function PATCH(req: NextRequest, ctx: ProxyCtx) { return proxy("PATCH", req, ctx); }
export async function DELETE(req: NextRequest, ctx: ProxyCtx) { return proxy("DELETE", req, ctx); }
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
