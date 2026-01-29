import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();

  const users = await User.find({})
    .select("name dob city phone email current_loans pre_approved_limit")
    .lean();

  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const user = await User.create(body);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("POST /api/users Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}