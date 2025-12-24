"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function OffersPanel() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/offers", {
        cache: "no-store",
      });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-teal-800">Loan Offers</h1>

        <Button
          variant="outline"
          className="border-teal-600 text-teal-700 hover:bg-teal-50"
          onClick={fetchOffers}
          disabled={loading}
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {offers.map((o: any, i) => (
          <div
            key={i}
            className="
            relative overflow-hidden
            bg-white rounded-2xl
            border border-teal-100
            p-6
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-xl
          "
          >
            {/* Teal accent */}
            <div className="absolute left-0 top-0 h-full w-1.5 bg-teal-600" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-semibold text-gray-800">{o.name}</p>
                <p className="text-sm text-gray-500">
                  Credit Score: {o.min_credit_score} – {o.max_credit_score}
                </p>
              </div>

              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  o.active
                    ? "bg-teal-100 text-teal-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {o.active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-gray-100" />

            {/* Amount */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">Loan Amount</p>
              <p className="text-2xl font-bold text-teal-700">
                ₹{o.min_amount.toLocaleString()} – ₹
                {o.max_amount.toLocaleString()}
              </p>
            </div>

            {/* Offer details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Interest Rate</p>
                <p className="font-semibold">{o.base_rate}%</p>
              </div>

              <div>
                <p className="text-gray-500">Processing Fee</p>
                <p className="font-semibold">{o.processing_fee_pct}%</p>
              </div>

              <div>
                <p className="text-gray-500">Min Tenure</p>
                <p className="font-semibold">{o.min_tenure_months} months</p>
              </div>

              <div>
                <p className="text-gray-500">Max Tenure</p>
                <p className="font-semibold">{o.max_tenure_months} months</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
