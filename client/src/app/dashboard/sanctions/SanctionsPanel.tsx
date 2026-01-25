"use client";

import { useState, useMemo, useTransition } from "react";
import {
  RefreshCcw,
  Search,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SanctionsPanel({ sanctionsData }: { sanctionsData: any[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [activeSanction, setActiveSanction] = useState<any | null>(sanctionsData?.[0] || null);
  const [search, setSearch] = useState("");

  const refreshData = async () => {
    setLoading(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setLoading(false);
        toast.success("Data refreshed");
      }, 800);
    });
  };

  const filteredSanctions = useMemo(() => {
    return sanctionsData.filter((s) =>
      `${s.customer_name} ${s.customer_id} ${s.status}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [sanctionsData, search]);

  const stats = useMemo(() => {
    const total = sanctionsData.length;
    const totalAmount = sanctionsData.reduce((acc, s) => acc + (s.loan_amount || 0), 0);
    const activeCount = sanctionsData.filter((s) => s.status === "active").length;
    const avgRate =
      total > 0 ? sanctionsData.reduce((acc, s) => acc + (s.interest_rate || 0), 0) / total : 0;

    return {
      total,
      totalAmount,
      activeCount,
      avgRate,
    };
  }, [sanctionsData]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle2 className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="h-16 flex items-center justify-between border-b border-gray-800/30 px-4">
        <h1 className="text-2xl font-bold">Sanction Management</h1>

        <Button onClick={refreshData} disabled={loading}>
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        <StatCard
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          label="Total Sanctions"
          value={stats.total.toString()}
          accentColor="bg-blue-50"
        />
        <StatCard
          icon={<IndianRupee className="h-6 w-6 text-emerald-600" />}
          label="Total Amount"
          value={`₹${(stats.totalAmount / 100000).toFixed(2)}L`}
          accentColor="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
          label="Avg. Rate"
          value={`${stats.avgRate.toFixed(1)}%`}
          accentColor="bg-teal-50"
        />
        <StatCard
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          label="Active Offers"
          value={stats.activeCount.toString()}
          accentColor="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 p-4">
        {/* LEFT LIST */}
        <aside className="bg-white rounded-[2rem] border border-teal-100 p-6 shadow-sm flex flex-col h-[70vh]">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-teal-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full rounded-2xl border-teal-50 pl-10 pr-4 py-4 text-sm focus:ring-teal-500 bg-teal-50/30 font-medium"
            />
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-sm font-semibold text-teal-700 uppercase tracking-wider">
              {filteredSanctions.length} Records Found
            </p>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 px-3 -mx-3 py-2 custom-scrollbar">
            {filteredSanctions.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSanction(s)}
                className={`w-full text-left rounded-2xl p-4 border-2 transition-all duration-300 group relative ${
                  activeSanction?._id === s._id
                    ? "bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-200 scale-[1.04] z-10"
                    : "bg-white border-transparent hover:border-teal-100 hover:bg-teal-50/50 hover:scale-[1.02]"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p
                    className={`font-bold text-base ${
                      activeSanction?._id === s._id ? "text-white" : "text-teal-900"
                    }`}
                  >
                    {s.customer_name}
                  </p>
                  <div
                    className={`rounded-full p-1.5 transition-all duration-300 ${
                      activeSanction?._id === s._id
                        ? "bg-white/20 text-white"
                        : "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white"
                    }`}
                  >
                    {getStatusIcon(s.status)}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p
                      className={`text-xs uppercase tracking-widest font-bold ${
                        activeSanction?._id === s._id ? "text-teal-100" : "text-teal-500"
                      }`}
                    >
                      Amount
                    </p>
                    <p
                      className={`font-bold ${
                        activeSanction?._id === s._id ? "text-white" : "text-teal-800"
                      }`}
                    >
                      ₹{(s.loan_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      activeSanction?._id === s._id ? "text-teal-50" : "text-teal-600/60"
                    }`}
                  >
                    Tenure: {(s.tenure_months / 12).toFixed(0)} Years
                  </p>
                </div>
              </button>
            ))}

            {filteredSanctions.length === 0 && (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 text-teal-100 mx-auto mb-4" />
                <p className="text-teal-800 font-medium">No records found</p>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT DETAILS */}
        {activeSanction ? (
          <main className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* MAIN INFO CARD */}
            <div className="bg-white rounded-[2.5rem] border border-teal-50 p-8 shadow-xl shadow-teal-900/5 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-teal-200">
                      {activeSanction.customer_name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-teal-950">
                        {activeSanction.customer_name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-teal-600 font-bold bg-teal-50 px-3 py-1 rounded-full text-sm">
                          ID: {activeSanction.customer_id}
                        </p>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
                          <CheckCircle2 className="h-4 w-4" />
                          {activeSanction.status?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {/* <Button
                      variant="outline"
                      asChild
                      className="rounded-2xl border-2 border-teal-100 py-3 px-5 h-auto hover:bg-teal-50 text-teal-700 font-bold text-sm"
                    >
                      <Link
                        href={`/letters/${activeSanction._id}`}
                        target="_blank"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Letter
                      </Link>
                    </Button> */}
                    <Button
                      asChild
                      className="rounded-2xl py-3 px-6 h-auto  shadow-lg shadow-teal-200 font-bold text-sm"
                    >
                      <Link href={`/letters/${activeSanction._id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        View Letter
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <DetailBox
                    label="Sanctioned Amount"
                    value={`₹${(activeSanction.loan_amount || 0).toLocaleString()}`}
                    subValue={`Tenure: ${activeSanction.tenure_months} Months`}
                  />
                  <DetailBox
                    label="Interest Rate"
                    value={`${activeSanction.interest_rate}% P.A.`}
                    subValue="Fixed Monthly Rate"
                  />
                  <DetailBox
                    label="EMI Amount"
                    value={`₹${(activeSanction.emi || 0).toLocaleString()}`}
                    subValue={`Total: ₹${(activeSanction.total_amount || 0).toLocaleString()}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-teal-50">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-teal-600" />
                      Breakdown
                    </h3>
                    <div className="space-y-3">
                      <BreakdownRow label="Principal Amount" value={activeSanction.loan_amount} />
                      <BreakdownRow label="Total Interest" value={activeSanction.total_interest} />
                      <BreakdownRow label="Processing Fee" value={activeSanction.processing_fee} />
                      <div className="pt-3 border-t border-dashed border-teal-100">
                        <BreakdownRow
                          label="Total Payable"
                          value={activeSanction.total_amount}
                          isTotal
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-teal-600" />
                      Bank Details
                    </h3>
                    <div className="bg-teal-50/50 rounded-3xl p-6 border border-teal-50">
                      <div className="space-y-4">
                        <BankInfo
                          label="Acc. Holder"
                          value={activeSanction.bank_details?.account_holder_name}
                        />
                        <BankInfo
                          label="Bank Name"
                          value={activeSanction.bank_details?.bank_name || "N/A"}
                        />
                        <BankInfo
                          label="Account #"
                          value={activeSanction.bank_details?.account_number}
                        />
                        <BankInfo
                          label="IFSC Code"
                          value={activeSanction.bank_details?.ifsc_code}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center text-xs font-medium text-teal-500 bg-teal-50/30 px-6 py-4 rounded-2xl">
                  <p>Created on: {new Date(activeSanction.created_at).toLocaleString()}</p>
                  <p>Validity: {activeSanction.validity_days || 30} Days</p>
                  <p>Ref ID: {activeSanction._id.toString()}</p>
                </div>
              </div>
            </div>
          </main>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-teal-100 h-[70vh]">
            <div className="h-24 w-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="h-12 w-12 text-teal-200" />
            </div>
            <h3 className="text-2xl font-bold text-teal-900">Select a Sanction</h3>
            <p className="text-teal-600 mt-2">
              Choose a record from the list to view detailed analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: any;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border border-teal-50 shadow-sm bg-white flex items-center gap-5 transition-transform hover:scale-[1.03] duration-300`}
    >
      <div
        className={`h-14 w-14 ${accentColor} rounded-2xl flex items-center justify-center shadow-sm`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-gray-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function DetailBox({ label, value, subValue }: { label: string; value: string; subValue: string }) {
  return (
    <div className="bg-teal-50/50 rounded-[1.5rem] p-5 border border-teal-50 group hover:bg-teal-600 transition-all duration-300">
      <p className="text-xs font-bold text-teal-600 mb-1 group-hover:text-white/80 transition-colors uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-black text-teal-950 group-hover:text-white transition-colors">
        {value}
      </p>
      <p className="text-xs font-bold text-teal-700/60 mt-2 group-hover:text-white/60 transition-colors italic">
        {subValue}
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  isTotal = false,
}: {
  label: string;
  value: number;
  isTotal?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <p
        className={`text-sm ${
          isTotal ? "font-black text-teal-950" : "font-semibold text-teal-700/70"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-sm ${
          isTotal ? "text-xl font-black text-teal-600" : "font-bold text-teal-900"
        }`}
      >
        ₹{(value || 0).toLocaleString()}
      </p>
    </div>
  );
}

function BankInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm font-bold text-teal-800/40 uppercase tracking-widest text-[10px]">
        {label}
      </p>
      <p className="text-sm font-bold text-teal-900 font-mono tracking-tight">{value || "N/A"}</p>
    </div>
  );
}
