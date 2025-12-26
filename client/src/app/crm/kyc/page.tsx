"use client";

import { useEffect, useState } from "react";
import {
  RefreshCcw,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function KycPanel() {
  const [kyc, setKyc] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kyc", { cache: "no-store" });
      const data = await res.json();
      setKyc(data.kyc);
      toast.success("KYC data refreshed");
    } catch (err) {
      console.error("Failed to fetch KYC", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, []);

  const getCreditBadge = (score: number) => {
    if (score >= 750) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 700) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const verifiedCount = kyc.filter((k) => k.verified).length;
  const pendingCount = kyc.length - verifiedCount;

  return (
    <div className="min-h-screen bg-[#F8FAF9] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-teal-800">KYC Dashboard</h1>

        <Button
          variant="outline"
          className="border-teal-600 text-teal-700 hover:bg-teal-50"
          onClick={fetchKyc}
          disabled={loading}
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={ShieldCheck}
          label="Total KYC"
          value={kyc.length}
          color="teal"
        />
        <KpiCard
          icon={UserCheck}
          label="Verified"
          value={verifiedCount}
          color="green"
        />
        <KpiCard
          icon={UserX}
          label="Pending"
          value={pendingCount}
          color="yellow"
        />
        <KpiCard
          icon={CreditCard}
          label="Avg Credit Score"
          value={
            kyc.length
              ? Math.round(
                  kyc.reduce((a, k) => a + k.credit_score, 0) / kyc.length
                )
              : 0
          }
          color="purple"
        />
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#FDF6EE]">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>PAN</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Credit Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {kyc.map((k, i) => (
              <TableRow
                key={i}
                className="hover:bg-teal-50 transition cursor-pointer"
              >
                {/* Name */}
                <TableCell className="font-semibold text-gray-800">
                  {k.name}
                </TableCell>

                {/* PAN */}
                <TableCell className="tracking-wider">{k.pan}</TableCell>

                {/* DOB */}
                <TableCell>{new Date(k.dob).toLocaleDateString()}</TableCell>

                {/* Phone */}
                <TableCell>{k.phone}</TableCell>

                {/* Address */}
                <TableCell className="max-w-xs truncate text-gray-600">
                  {k.address}
                </TableCell>

                {/* Credit Score */}
                <TableCell>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCreditBadge(
                      k.credit_score
                    )}`}
                  >
                    {k.credit_score}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {k.verified ? (
                    <Badge className="bg-green-600 text-white flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: "teal" | "green" | "yellow" | "purple";
}) {
  const colorMap: any = {
    teal: "bg-teal-50 text-teal-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-3xl border bg-white p-5 hover:shadow-md transition">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
