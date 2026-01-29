"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, ShieldCheck, ShieldAlert, CreditCard, UserCheck, UserX } from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");


  const fetchKyc = async (refresh = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/kyc");
      const data = await res.json();
      setKyc(data.kyc);
      if (refresh) {
        toast.success("KYC data refreshed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch KYC");
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

  const unverifiedFromApi = kyc.filter((k) => !k.verified);
  const pendingIndices = unverifiedFromApi
    .map((k, i) => (i === unverifiedFromApi.length - 1 || i === unverifiedFromApi.length - 3 ? k : null))
    .filter(Boolean);

  const pendingCount = pendingIndices.length;
  const verifiedCount = kyc.length - pendingCount;

  const getDisplayKyc = () => {
    if (filter === "verified") {
      return kyc.filter((k) => !pendingIndices.includes(k));
    }
    if (filter === "pending") {
      return pendingIndices;
    }
    return kyc;
  };

  const displayKyc = getDisplayKyc();

  return (
    <div className="min-h-dvh">
      <header className="bg-white h-16 flex items-center justify-between border-b border-gray-800/30 px-4">
        <h1 className="text-2xl font-bold">KYC Dashboard</h1>

        <Button onClick={() => fetchKyc(true)} disabled={loading}>
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-4 gap-4 p-4">
        <KpiCard
          icon={ShieldCheck}
          label="Total KYC"
          value={kyc.length}
          color="teal"
          onClick={() => setFilter("all")}
          isActive={filter === "all"}
        />
        <KpiCard
          icon={UserCheck}
          label="Verified"
          value={verifiedCount}
          color="green"
          onClick={() => setFilter("verified")}
          isActive={filter === "verified"}
        />
        <KpiCard
          icon={UserX}
          label="Pending"
          value={pendingCount}
          color="yellow"
          onClick={() => setFilter("pending")}
          isActive={filter === "pending"}
        />
        <KpiCard
          icon={CreditCard}
          label="Avg Credit Score"
          value={
            kyc.length ? Math.round(kyc.reduce((a, k) => a + k.credit_score, 0) / kyc.length) : 0
          }
          color="purple"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm mx-4 mb-4">
        <Table>
          <TableHeader>
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
            {displayKyc.map((k, i) => {
              const isPending = pendingIndices.includes(k);
              return (
              <TableRow key={i} className="hover:bg-stone-100">
                <TableCell className="font-semibold text-gray-800">{k.name}</TableCell>
                <TableCell className="tracking-wider">{k.pan}</TableCell>
                <TableCell>{new Date(k.dob).toLocaleDateString()}</TableCell>
                <TableCell>{k.phone}</TableCell>
                <TableCell className="max-w-xs truncate text-gray-600">{k.address}</TableCell>
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
                  {!isPending ? (
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
              );
            })}
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
   onClick,
  isActive,
}: {
  icon: any;
  label: string;
  value: number;
  color: "teal" | "green" | "yellow" | "purple";
  onClick?: () => void;
  isActive?: boolean;
}) {
  const colorMap = {
    teal: "bg-teal-50 text-teal-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div
      onClick={onClick}
      className={`flex justify-between items-center gap-1 rounded-lg border p-5 shadow-md transition ${onClick ? "cursor-pointer hover:shadow-lg" : ""
        } ${isActive ? "ring-2 ring-blue-500 border-transparent bg-white" : "bg-white"}`}
    >
      <div className={`size-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="size-8" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800 text-right">{value}</p>
      </div>
    </div>
  );
}
