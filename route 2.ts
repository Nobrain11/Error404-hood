/**
 * API Route: /api/apikey
 * POST — generate a JWT-signed API key for authenticated bot usage.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json() as { address?: string };
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const token = await new SignJWT({ walletAddress: address })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(address)
      .setIssuedAt()
      .setExpirationTime("90d")
      .sign(SECRET);

    return NextResponse.json({ apiKey: token });
  } catch (err) {
    console.error("[/api/apikey]", err);
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ valid: false });
  try {
    const { payload } = await jwtVerify(key, SECRET);
    return NextResponse.json({ valid: true, address: payload.walletAddress });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
