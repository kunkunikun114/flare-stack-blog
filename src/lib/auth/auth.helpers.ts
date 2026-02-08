/**
 * 针对 Cloudflare Workers 优化的自定义密码哈希实现
 * 基于：https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/crypto/password.ts
 *
 * 优化内容：
 * - 将 N 从 16384 降低到 8192（减少约 50% CPU 时间）
 * - 将 r 从 16 降低到 8（进一步优化性能）
 * - 仍符合安全标准（N=8192 满足 OWASP 推荐）
 */

import { hex } from "@better-auth/utils/hex";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { hexToBytes } from "@noble/hashes/utils.js";

// 针对 Cloudflare Workers CPU 限制优化的 scrypt 配置
const SCRYPT_CONFIG = {
  N: 8192, // 默认值: 16384 - 降低以适配 Workers
  r: 8, // 默认值: 16 - 降低以提升性能
  p: 1,
  dkLen: 64,
};

/**
 * 使用恒定时间比较两个缓冲区，防止时序攻击
 * 来源：https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/crypto/buffer.ts
 */
function constantTimeEqual(
  a: ArrayBuffer | Uint8Array | string,
  b: ArrayBuffer | Uint8Array | string,
): boolean {
  if (typeof a === "string") {
    a = new TextEncoder().encode(a);
  }
  if (typeof b === "string") {
    b = new TextEncoder().encode(b);
  }
  const aBuffer = new Uint8Array(a);
  const bBuffer = new Uint8Array(b);
  let c = aBuffer.length ^ bBuffer.length;
  const length = Math.max(aBuffer.length, bBuffer.length);
  for (let i = 0; i < length; i++) {
    c |=
      (i < aBuffer.length ? aBuffer[i] : 0) ^
      (i < bBuffer.length ? bBuffer[i] : 0);
  }
  return c === 0;
}

async function generateKey(password: string, salt: string) {
  return await scryptAsync(password.normalize("NFKC"), salt, {
    N: SCRYPT_CONFIG.N,
    p: SCRYPT_CONFIG.p,
    r: SCRYPT_CONFIG.r,
    dkLen: SCRYPT_CONFIG.dkLen,
    maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = hex.encode(crypto.getRandomValues(new Uint8Array(16)));
  const key = await generateKey(password, salt);
  return `${salt}:${hex.encode(key)}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [salt, key] = hash.split(":");
  if (!salt || !key) {
    throw new Error("Invalid password hash");
  }
  const targetKey = await generateKey(password, salt);
  return constantTimeEqual(targetKey, hexToBytes(key));
}
