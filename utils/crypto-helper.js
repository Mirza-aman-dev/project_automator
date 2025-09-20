import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";

function sha512({ content }) {
  return createHash("sha512").update(content).digest("hex");
}

export function hashPassword({ password, salt }) {
  let hash = sha512({ content: password + salt });
  return hash;
}

export function generateSalt() {
  return uuidv4();
}

// compare password with hash
export function comparePassword({ password, hash, salt }) {
  return hashPassword(password, salt) === hash;
}

export default {
    hashPassword,
    generateSalt,
    comparePassword,
};
