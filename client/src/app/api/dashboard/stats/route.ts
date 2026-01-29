import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Sanction } from "@/models/Sanction";
import { User } from "@/models/User";
import { Kyc } from "@/models/Kyc";
import { Session } from "../../../../models/Session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Parallel fetch for better performance
    const [
      totalRevenueResult,
      activeCustomersCount,
      activeSessionsCount,
      applicationsCount,
      monthlyData,
      recentSessions,
    ] = await Promise.all([
      // 1. Total Revenue (Sum of Sanctioned User loan amounts)
      Sanction.aggregate([{ $group: { _id: null, total: { $sum: "$loan_amount" } } }]),

      // 2. Active Customers (Total Users)
      User.countDocuments({}),

      // 3. Active Sessions (Total Active Sessions)
      Session.countDocuments({ is_active: true }),

      // 4. Applications (Total KYC records)
      Kyc.countDocuments({}),

      // 5. Monthly Chart Data (Aggregation by month)
      Sanction.aggregate([
        {
          $group: {
            _id: { $month: "$created_at" },
            total: { $sum: "$loan_amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Recent Sessions (Latest 5)
      Session.find({
        is_active: true,
        "metadata.customer_id": { $exists: true, $ne: null },
      })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
    ]);

    // Format Monthly Data
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    const chartData = months.map((name, index) => {
      const monthData = monthlyData.find((d) => d._id === index + 1);
      return {
        name,
        total: monthData ? monthData.total : 0,
      };
    });

    // Format Recent Activity from Session Metadata
    const formattedRecentActivity = recentSessions.map((session: any) => ({
      user: {
        name: session.metadata?.customer_data?.name || "Anonymous",
        email: session.metadata?.customer_data?.email || "No Email",
        image: null,
      },
      createdAt: session.created_at,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        revenue: totalRevenueResult[0]?.total || 0,
        customers: activeCustomersCount,
        sessions: activeSessionsCount,
        applications: applicationsCount,
      },
      chartData,
      recentActivity: formattedRecentActivity,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
