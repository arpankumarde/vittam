"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = async (refresh = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users);
      setActiveUser(data.users[0]);
      if (refresh) {
        toast.success("User data refreshed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      `${u.name} ${u.email} ${u.city}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  return (
    <div className="h-dvh">
      <header className="bg-white h-16 flex items-center justify-between border-b border-gray-800/30 px-4">
        <h1 className="text-2xl font-bold">Customer Data</h1>

        <Button onClick={() => fetchUsers(true)} disabled={loading}>
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-[300px_1fr] h-[80dvh]">
        <aside className="bg-white border p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <p className="text-sm text-gray-500 mb-3">{filteredUsers.length} users found</p>

          <div className="space-y-2 h-[75dvh] overflow-y-auto">
            {filteredUsers.map((u, i) => (
              <button
                key={i}
                onClick={() => setActiveUser(u)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  activeUser?.email === u.email ? "bg-teal-50 border-teal-300" : "hover:bg-gray-50"
                }`}
              >
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{`${u.city}, India`}</p>
                <p className="text-xs text-teal-700 mt-1">
                  ₹{u.pre_approved_limit.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT DETAILS */}
        {activeUser && (
          <main className="space-y-6 m-4">
            {/* PROFILE HEADER */}
            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-700">
                  {activeUser.name.charAt(0)}
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{activeUser.name}</h2>
                  <p className="text-sm text-gray-500">{activeUser.city}, India</p>
                </div>
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-3 gap-4">
                <InfoCard label="Email" value={activeUser?.email} />
                <InfoCard
                  label="Date of Birth"
                  value={new Date(activeUser.dob).toLocaleDateString()}
                />
                <InfoCard label="Phone" value={activeUser.phone} />
              </div>
            </div>

            <div className="flex gap-6">
              {/* EXISTING LOANS */}
              <div className="flex-1 rounded-3xl border p-6 shadow-sm bg-white">
                <h3 className="text-lg font-semibold mb-2">Existing Loans</h3>

                {activeUser.current_loans?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {activeUser.current_loans.map((loan: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl bg-[#FDF6EE] px-4 py-3 hover:shadow transition"
                      >
                        <p className="font-medium text-sm">{loan.type}</p>
                        <p className="text-xs text-gray-600">EMI ₹{loan.emi.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          Outstanding ₹{loan.outstanding.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active loans</p>
                )}
              </div>

              {/* PRE-APPROVED LIMIT */}
              <div className="flex-1 rounded-3xl bg-white border p-6">
                <p className="text-sm text-green-700 mb-1">Pre-approved Limit</p>

                <p className="text-4xl font-bold text-green-600">
                  ₹{activeUser.pre_approved_limit.toLocaleString()}
                </p>

                <p className="text-xs text-green-700 mt-2">Based on current profile</p>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 hover:shadow-sm transition">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
