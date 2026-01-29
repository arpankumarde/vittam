"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  DollarSign,
  Users,
  CreditCard,
  Activity,
  Download,
  TrendingUp,
  Bell,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// Mock data for Analytics
const userGrowthData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 600 },
  { name: "Mar", users: 900 },
  { name: "Apr", users: 1200 },
  { name: "May", users: 1500 },
  { name: "Jun", users: 2000 },
];

const revenueDistributionData = [
  { name: "Personal Loan", value: 400 },
  { name: "Home Loan", value: 300 },
  { name: "Car Loan", value: 300 },
  { name: "Education Loan", value: 200 },
];
const COLORS = ["#0d9488", "#14b8a6", "#5eead4", "#99f6e4"];

// Mock data for Reports
const reportsData = [
  { id: "RPT-001", name: "Monthly Disbursement Report", date: "2024-02-01", status: "Ready" },
  { id: "RPT-002", name: "User Acquisition Summary", date: "2024-01-31", status: "Ready" },
  { id: "RPT-003", name: "Risk Assessment Q3", date: "2024-01-15", status: "Pending" },
  { id: "RPT-004", name: "Annual Financial Statement", date: "2024-01-10", status: "Ready" },
];

// Mock data for Notifications
const notificationsData = [
  {
    id: 1,
    title: "System Maintenance",
    message: "Scheduled maintenance on Feb 10, 2024 at 2:00 AM.",
    type: "alert",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "New Loan Scheme",
    message: "Education loan interest rates reduced to 8.5%.",
    type: "info",
    time: "5 hours ago",
  },
  {
    id: 3,
    title: "Goal Achieved",
    message: "You hit your monthly target for user acquisitions!",
    type: "success",
    time: "1 day ago",
  },
];

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    sessions: 0,
    applications: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setChartData(data.chartData);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white h-16 flex items-center justify-between border-b border-gray-800/30 px-4 shrink-0">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      <div className="flex-1 space-y-4 p-4 overflow-y-auto">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-gray-300 p-1 rounded-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-gray-600 data-[state=active]:text-gray-900"
            >
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Revenue"
                value={`₹${stats.revenue.toLocaleString()}`}
                description="Total sanctioned amount"
                icon={DollarSign}
              />
              <StatsCard
                title="Active Customers"
                value={stats.customers.toLocaleString()}
                description="Registered users"
                icon={Users}
              />
              <StatsCard
                title="Applications"
                value={stats.applications.toLocaleString()}
                description="KYC submissions"
                icon={CreditCard}
              />
              <StatsCard
                title="Active Sessions"
                value={stats.sessions.toLocaleString()}
                description="Current user sessions"
                icon={Activity}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">User Growth Trends</CardTitle>
                  <CardDescription>New user registrations over the last 6 months.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="name"
                          stroke="#6b7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="users"
                          stroke="#0d9488"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Recent Sessions</CardTitle>
                  <CardDescription className="text-gray-500">
                    Latest active sessions from users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSalesList activities={recentActivity} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    Overview
                    <TrendingUp className="h-4 w-4 text-teal-600" />
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Monthly loan disbursement volume across all regions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <OverviewChart data={chartData} />
                </CardContent>
              </Card>
              <Card className="col-span-3 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Revenue Distribution</CardTitle>
                  <CardDescription>Breakdown by loan product type.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {revenueDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Generated Reports</CardTitle>
                <CardDescription>Download detailed reports for your analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportsData.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.id}</TableCell>
                        <TableCell>{report.name}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              report.status === "Ready"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {report.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4 text-gray-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {notificationsData.map((note) => (
                <Card key={note.id} className="border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-start space-y-0 pb-2 gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        note.type === "alert"
                          ? "bg-red-100 text-red-600"
                          : note.type === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {note.type === "alert" ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : note.type === "success" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium text-gray-900">
                        {note.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{note.message}</CardDescription>
                      <p className="text-xs text-gray-400 mt-2">{note.time}</p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      )}
    </div>
  );
};

export default Page;

function StatsCard({ title, value, description, icon: Icon }: any) {
  return (
    <Card className="gap-2 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="size-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function OverviewChart({ data }: { data: any[] }) {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            cursor={{ fill: "#f9fafb" }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} className="fill-teal-600" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RecentSalesList({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return <div className="text-sm text-gray-500">No active sessions found.</div>;
  }

  return (
    <div className="space-y-8">
      {activities.map((session, i) => (
        <div className="flex items-center" key={i}>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">
              {session.user?.name || "Unknown User"}
            </p>
            <p className="text-xs text-gray-500">{session.user?.email || "No email"}</p>
          </div>
          <div className="ml-auto font-medium text-xs text-gray-500">
            {new Date(session.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
