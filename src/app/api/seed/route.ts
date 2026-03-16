import { NextResponse } from "next/server";
import { ensureUsersSeeded } from "@/lib/auth";

/**
 * GET /api/seed
 * Seeds the predefined users into MongoDB.
 * Safe to call multiple times — skips existing users.
 */
export async function GET() {
  try {
    await ensureUsersSeeded();
    return NextResponse.json({ ok: true, message: "Users seeded successfully." });
  } catch (err: unknown) {
    console.error("[seed] Error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
