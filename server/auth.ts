import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const HASH_ALGORITHM = "sha256";
const HASH_ITERATIONS = 120_000;
const HASH_KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export interface PasswordRecord {
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  passwordAlgorithm?: string;
}

export function hashPassword(password: string): {
  passwordHash: string;
  passwordSalt: string;
  passwordAlgorithm: string;
} {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEY_LENGTH,
    HASH_ALGORITHM,
  ).toString("hex");

  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgorithm: `${HASH_ALGORITHM}:${HASH_ITERATIONS}:${HASH_KEY_LENGTH}`,
  };
}

export function verifyPassword(
  record: PasswordRecord,
  password: string,
): boolean {
  if (record.passwordHash && record.passwordSalt && record.passwordAlgorithm) {
    const expected = Buffer.from(record.passwordHash, "hex");
    const actual = pbkdf2Sync(
      password,
      record.passwordSalt,
      HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      HASH_ALGORITHM,
    );

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  return record.password === password;
}

export function withoutPassword(user: Record<string, unknown>) {
  const {
    password,
    passwordHash,
    passwordSalt,
    passwordAlgorithm,
    _id,
    ...safeUser
  } = user;
  return safeUser;
}
