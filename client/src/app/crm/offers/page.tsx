"use client";

import { Button } from "@/components/ui/button";
import {
  RefreshCcw,
  Percent,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

export default function OffersPanel() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/offers", { cache: "no-store" });
      const data = await res.json();
      setOffers(data.offers);
      toast.success("Offers updated");
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" ||
        (status === "active" && o.active) ||
        (status === "inactive" && !o.active);

      return matchesSearch && matchesStatus;
    });
  }, [offers, search, status]);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-teal-800">Loan Offers</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-teal-600 text-teal-700 hover:bg-teal-50"
            onClick={fetchOffers}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border pl-9 pr-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl border bg-white pl-9 pr-8 py-2 text-sm focus:outline-none"
          >
            <option value="all">All Offers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* OFFERS GRID */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredOffers.map((o, i) => (
          <div
            key={i}
            className="
              relative rounded-2xl border bg-white
              p-6
              transition-all
              hover:shadow-lg hover:-translate-y-1
            "
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              {o.active ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
                  <XCircle className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </div>

            {/* Title */}
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-800">{o.name}</p>
              <p className="text-xs text-gray-500">
                Credit Score: {o.min_credit_score} – {o.max_credit_score}
              </p>
            </div>

            {/* Amount */}
            <div className="mb-5 rounded-xl bg-teal-50 p-4">
              <p className="text-xs text-teal-700 mb-1">Loan Amount</p>
              <p className="text-xl font-bold text-teal-800">
                ₹{o.min_amount.toLocaleString()} – ₹
                {o.max_amount.toLocaleString()}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <Detail
                icon={Percent}
                label="Interest"
                value={`${o.base_rate}%`}
              />
              <Detail
                icon={Percent}
                label="Processing Fee"
                value={`${o.processing_fee_pct}%`}
              />
              <Detail
                icon={Calendar}
                label="Min Tenure"
                value={`${o.min_tenure_months} mo`}
              />
              <Detail
                icon={Calendar}
                label="Max Tenure"
                value={`${o.max_tenure_months} mo`}
              />
            </div>
          </div>
        ))}

        {filteredOffers.length === 0 && (
          <p className="text-sm text-gray-500">No offers found</p>
        )}
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
