import bcrypt from "bcryptjs";
import connectDB from "./mongodb";
import { User } from "./models/User";

// Predefined users — no registration allowed.
// Passwords are stored as bcrypt hashes in MongoDB.
const PREDEFINED_USERS = [
  {
    name: "Uploader",
    email: "varush395@gmail.com",
    password: "Arush@123",
    role: "uploader" as const,
  },
  {
    name: "Viewer",
    email: "mishrajii@gmail.com",
    password: "Shivangi@123",
    role: "viewer" as const,
  },
];

export type UserRole = "uploader" | "viewer";

/**
 * Ensures predefined users exist in MongoDB (seeds on first run).
 * Passwords are hashed with bcrypt before storage.
 */
export async function ensureUsersSeeded() {
  await connectDB();

  for (const u of PREDEFINED_USERS) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const hashed = await bcrypt.hash(u.password, 12);
      await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
      console.log(`[Auth] Seeded user: ${u.email} (${u.role})`);
    }
  }
}

/**
 * Looks up a user by email + password.
 * Seeds predefined users the first time it's called if the DB is empty.
 */
export async function findUser(email: string, password: string) {
  await connectDB();
  await ensureUsersSeeded();

  const user = await User.findOne({ email });
  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}
