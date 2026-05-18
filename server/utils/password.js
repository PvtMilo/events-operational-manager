import bcrypt from "bcryptjs";

export async function verifyAppPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashAppPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
}