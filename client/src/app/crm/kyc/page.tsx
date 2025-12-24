"use client";

import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
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
  const [kyc, setKyc] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kyc", {
        cache: "no-store",
      });
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
    if (score >= 750) {
      return "bg-green-100 text-green-700 border-green-200";
    }
    if (score >= 700) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-teal-800">KYC Details</h1>

        <Button
          variant="outline"
          className="border-teal-600 text-teal-700 hover:bg-teal-50"
          onClick={fetchKyc}
          disabled={loading}
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
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
            {kyc.map((k: any, i: number) => (
              <TableRow key={i} className="hover:bg-teal-50 transition">
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
                <TableCell className="max-w-xs truncate">{k.address}</TableCell>

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

                {/* Verification Status */}
                <TableCell>
                  <Badge
                    className={
                      k.verified
                        ? "bg-teal-600 text-white"
                        : "bg-yellow-500 text-white"
                    }
                  >
                    {k.verified ? "Verified" : "Pending"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
