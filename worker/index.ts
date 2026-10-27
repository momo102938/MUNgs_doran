import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const SESSION_COOKIE = "__Host-doran_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

type Session = { id: string; token: string; fresh: boolean };

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

async function signSession(id: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id));
  return encodeBase64Url(new Uint8Array(signature));
}

async function getSession(request: Request, secret: string): Promise<Session> {
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  const [id, signature, extra] = cookie?.split(".") ?? [];
  if (id && signature && !extra && /^[0-9a-f-]{36}$/i.test(id)) {
    const supplied = decodeBase64Url(signature);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (supplied && await crypto.subtle.verify("HMAC", key, supplied, new TextEncoder().encode(id))) {
      return { id, token: `${id}.${signature}`, fresh: false };
    }
  }
  const newId = crypto.randomUUID();
  return { id: newId, token: `${newId}.${await signSession(newId, secret)}`, fresh: true };
}

function sanitizeIdentity(request: Request, userId: string | null): Request {
  const headers = new Headers(request.headers);
  // Never trust identity headers supplied by a public visitor.
  for (const name of [...headers.keys()]) {
    if (name.startsWith("oai-authenticated-user-")) headers.delete(name);
  }
  if (!userId) return new Request(request, { headers });
  headers.set("oai-authenticated-user-id", userId);
  headers.set("oai-authenticated-user-email", `${userId}@visitor.doran.invalid`);
  headers.set("oai-authenticated-user-full-name", "도란 방문자");
  headers.set("oai-authenticated-user-full-name-encoding", "percent-encoded-utf-8");
  return new Request(request, { headers });
}

function setSessionCookie(response: Response, token: string): Response {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const session = env.SESSION_SECRET
      ? await getSession(request, env.SESSION_SECRET)
      : null;
    const authenticatedRequest = sanitizeIdentity(request, session?.id ?? null);
    const response = await runWithConnectorBinding(binding, () => handler.fetch(authenticatedRequest, env, ctx));
    return session?.fresh ? setSessionCookie(response, session.token) : response;
  },
};

export default worker;
