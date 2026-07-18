import { NextResponse } from "next/server";

/* ============================================
   Webhooks API Route — Stabilization Stub
   To be implemented in a future sprint.
   ============================================ */

export async function POST() {
  return NextResponse.json(
    { error: "Webhook handler not yet implemented" },
    { status: 501 }
  );
}
