"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw, Percent, Calendar, Search, Filter, CheckCircle, XCircle, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function OffersPanel() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  
  // Form State
   const initialFormData = {
    name: "",
    min_credit_score: 700,
    max_credit_score: 900,
    min_amount: 10000,
    max_amount: 500000,
    min_tenure_months: 6,
    max_tenure_months: 36,
    base_rate: 10.5,
    processing_fee_pct: 1.5,
  };
  const [formData, setFormData] = useState(initialFormData);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(initialFormData);
    }
  };

  const fetchOffers = async (refresh = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(data.offers);
      if (refresh) {
        toast.success("Offers updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

   const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New offer created");
        setOpen(false);
        fetchOffers();
      } else {
        toast.error(data.error || "Failed to create offer");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-dvh">
      <header className="bg-white h-16 flex items-center justify-between border-b border-gray-800/30 px-4">
        <h1 className="text-2xl font-bold">Loan Offers</h1>

        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="size-4" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Loan Offer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOffer} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Offer Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Premium Home Loan"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="min_credit">Min Credit Score</Label>
                    <Input
                      id="min_credit"
                      type="number"
                      value={formData.min_credit_score}
                      onChange={(e) =>
                        setFormData({ ...formData, min_credit_score: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_credit">Max Credit Score</Label>
                    <Input
                      id="max_credit"
                      type="number"
                      value={formData.max_credit_score}
                      onChange={(e) =>
                        setFormData({ ...formData, max_credit_score: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="min_amount">Min Amount (₹)</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, min_amount: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_amount">Max Amount (₹)</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_amount: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="rate">Base Rate (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.base_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, base_rate: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fee">Processing Fee (%)</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      value={formData.processing_fee_pct}
                      onChange={(e) =>
                        setFormData({ ...formData, processing_fee_pct: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="min_tenure">Min Tenure (mo)</Label>
                    <Input
                      id="min_tenure"
                      type="number"
                      value={formData.min_tenure_months}
                      onChange={(e) =>
                        setFormData({ ...formData, min_tenure_months: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="max_tenure">Max Tenure (mo)</Label>
                    <Input
                      id="max_tenure"
                      type="number"
                      value={formData.max_tenure_months}
                      onChange={(e) =>
                        setFormData({ ...formData, max_tenure_months: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="w-full bg-teal-600">
                    {loading ? "Creating..." : "Create Offer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => fetchOffers(true)} disabled={loading}>
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 p-4">
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
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 px-4 pb-8">
        {filteredOffers.map((o, i) => (
          <div
            key={i}
            className="relative rounded-2xl border bg-white p-6
              transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
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
                ₹{o.min_amount?.toLocaleString()} – ₹{o.max_amount?.toLocaleString()}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <Detail icon={Percent} label="Interest" value={`${o.base_rate}%`} />
              <Detail icon={Percent} label="Processing Fee" value={`${o.processing_fee_pct}%`} />
              <Detail icon={Calendar} label="Min Tenure" value={`${o.min_tenure_months} mo`} />
              <Detail icon={Calendar} label="Max Tenure" value={`${o.max_tenure_months} mo`} />
            </div>
          </div>
        ))}

        {filteredOffers.length === 0 && <p className="text-sm text-gray-500">No offers found</p>}
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
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
