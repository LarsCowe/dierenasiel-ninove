import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  "dierenasiel-ninove-dev-secret-change-in-prod"
);

// Mock NextResponse before importing middleware
const mockNext = vi.fn(() => ({ type: "next" as const }));
const mockRedirect = vi.fn((url: URL) => ({
  type: "redirect" as const,
  location: url.pathname,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: URL) => mockRedirect(url),
  },
}));

import { middleware } from "./middleware";

async function createTestToken(
  role: string,
  expired = false
): Promise<string> {
  const jwt = new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt();

  if (expired) {
    jwt.setExpirationTime(Math.floor(Date.now() / 1000) - 1);
  } else {
    jwt.setExpirationTime("8h");
  }

  return jwt.sign(SECRET);
}

function mockRequest(
  pathname: string,
  cookies: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      get: (name: string) =>
        cookies[name] ? { value: cookies[name] } : undefined,
      has: (name: string) => name in cookies,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("middleware", () => {
  describe("public paths", () => {
    it("allows /login without auth", async () => {
      await middleware(mockRequest("/login"));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows /api routes without auth", async () => {
      await middleware(mockRequest("/api/test"));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows /_next without auth", async () => {
      await middleware(mockRequest("/_next/static/chunk.js"));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows static files with extensions", async () => {
      await middleware(mockRequest("/image.png"));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("beheerder routes", () => {
    it("redirects to /login without session", async () => {
      await middleware(mockRequest("/beheerder"));
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it.each([
      "beheerder",
      "medewerker",
      "dierenarts",
      "adoptieconsulent",
      "coördinator",
    ])("allows %s role to access /beheerder", async (role) => {
      const token = await createTestToken(role);
      await middleware(mockRequest("/beheerder", { session: token }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("redirects surfer role from /beheerder", async () => {
      const token = await createTestToken("surfer");
      await middleware(mockRequest("/beheerder", { session: token }));
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("redirects wandelaar role from /beheerder", async () => {
      const token = await createTestToken("wandelaar");
      await middleware(mockRequest("/beheerder", { session: token }));
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("redirects on expired JWT", async () => {
      const token = await createTestToken("beheerder", true);
      await middleware(mockRequest("/beheerder", { session: token }));
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("wandelaar routes", () => {
    it("allows wandelaar role", async () => {
      const token = await createTestToken("wandelaar");
      await middleware(mockRequest("/wandelaar", { session: token }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows beheerder role to access /wandelaar", async () => {
      const token = await createTestToken("beheerder");
      await middleware(mockRequest("/wandelaar", { session: token }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("redirects surfer from /wandelaar", async () => {
      const token = await createTestToken("surfer");
      await middleware(mockRequest("/wandelaar", { session: token }));
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  describe("default routes (surfer)", () => {
    it("allows with session cookie", async () => {
      const token = await createTestToken("surfer");
      await middleware(mockRequest("/", { session: token }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows with guest-mode cookie", async () => {
      await middleware(mockRequest("/", { "guest-mode": "true" }));
      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("redirects without any cookie", async () => {
      await middleware(mockRequest("/"));
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
