import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "alaska_admin_session";

const encoder = new TextEncoder();

function getSecretKey() {
  return encoder.encode(
    process.env.ADMIN_SESSION_SECRET ?? "local-dev-secret-change-me"
  );
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME ?? "admin";
}

export async function validateAdminCredentials(
  username: string,
  password: string
) {
  if (username !== getAdminUsername()) {
    return false;
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  return password === (process.env.ADMIN_PASSWORD ?? "alaska-demo");
}

export async function createAdminSessionToken(username: string) {
  return new SignJWT({ role: "admin", username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function getSafeAdminRedirect(pathname: string | null | undefined) {
  if (!pathname || !pathname.startsWith("/admin")) {
    return "/admin";
  }

  return pathname;
}
