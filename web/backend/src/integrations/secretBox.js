import crypto from "node:crypto";

/** AES-256-GCM for small secrets stored in the database (e.g. a Dolphin API key).
 *  The key comes from SECRETS_KEY, falling back to JWT_SECRET so dev setups work. */
function key() {
  const material = process.env.SECRETS_KEY || process.env.JWT_SECRET;
  if (!material) throw new Error("SECRETS_KEY (or JWT_SECRET) must be set to store secrets.");
  return crypto.createHash("sha256").update(`nohayo-secret-box:${material}`).digest();
}

export function seal(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function open(sealed) {
  const [version, iv, tag, data] = String(sealed).split(":");
  if (version !== "v1") throw new Error("Unknown secret format.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
