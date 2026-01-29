import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OfferTemplate } from "@/models/OfferTemplate";
export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();

  const offers = await OfferTemplate.find({}).select({}).lean();

  return NextResponse.json({ success: true, offers });
}

export async function POST(req: NextRequest) {
  console.log("POST /api/offers hit");
  try {
    await connectDB();
    const body = await req.json();
    console.log("Request Body:", body);
    const offer = await OfferTemplate.create(body);
    return NextResponse.json({ success: true, offer });
  } catch (err) {
    console.error("POST /api/offers Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
