// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

const { mockCookieStore } = vi.hoisted(() => {
  const mockCookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
  return { mockCookieStore };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { SignJWT } from "jose";
import { createSession, getSession } from "../auth";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  expect(mockCookieStore.set.mock.calls[0][0]).toBe("auth-token");
});

test("createSession JWT payload contains userId and email", async () => {
  await createSession("user-42", "test@example.com");

  const token = mockCookieStore.set.mock.calls[0][1] as string;
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("test@example.com");
});

test("createSession JWT uses HS256", async () => {
  await createSession("user-1", "user@example.com");

  const token = mockCookieStore.set.mock.calls[0][1] as string;
  const header = JSON.parse(atob(token.split(".")[0]));

  expect(header.alg).toBe("HS256");
});

test("createSession sets cookie as httpOnly", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite to lax", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.sameSite).toBe("lax");
});

test("createSession sets secure to false outside production", async () => {
  await createSession("user-1", "user@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

// helpers
function makeToken(payload: object, expiresIn: string = "7d") {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

test("createSession sets expiry ~7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const options = mockCookieStore.set.mock.calls[0][2];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect((options.expires as Date).getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect((options.expires as Date).getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

// getSession

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null when cookie has no value", async () => {
  mockCookieStore.get.mockReturnValue({ value: undefined });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-7", email: "hello@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session?.userId).toBe("user-7");
  expect(session?.email).toBe("hello@example.com");
});

test("getSession returns null for a malformed token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.jwt" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken({ userId: "user-1", email: "x@example.com" }, "0s");
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for a token signed with the wrong secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "x@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(wrongSecret);
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});
