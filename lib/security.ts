import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export function generateEditCode() {
  return randomBytes(18).toString("base64url");
}

export function hashEditCode(editCode: string) {
  return bcrypt.hash(editCode, 12);
}

export function verifyEditCode(editCode: string, hash: string) {
  return bcrypt.compare(editCode, hash);
}

export function requireAccessPassword(password: string | undefined) {
  return Boolean(password && password === process.env.PHYSICS_MAP_ACCESS_PASSWORD);
}

export function requireAdminPassword(password: string | undefined) {
  return Boolean(password && password === process.env.PHYSICS_MAP_ADMIN_PASSWORD);
}
