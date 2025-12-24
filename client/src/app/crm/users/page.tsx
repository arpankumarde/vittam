"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        cache: "no-store",
      });
      const data = await res.json();
      setUsers(data.users);
      toast.success("User data refreshed");
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-teal-800">Users</h1>

        <Button
          variant="outline"
          className="border-teal-600 text-teal-700 hover:bg-teal-50"
          onClick={fetchUsers}
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
              <TableHead>City</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Loans</TableHead>
              <TableHead className="text-right">Pre-approved Limit</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((u: any, i) => (
              <TableRow key={i} className="hover:bg-teal-50 transition">
                {/* Name */}
                <TableCell>
                  <p className="font-semibold text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </TableCell>

                {/* City */}
                <TableCell>{u.city}</TableCell>

                {/* DOB */}
                <TableCell>{new Date(u.dob).toLocaleDateString()}</TableCell>

                {/* Contact */}
                <TableCell>
                  <p className="text-sm">{u.phone}</p>
                </TableCell>

                {/* Loans */}
                <TableCell>
                  {u.current_loans?.length > 0 ? (
                    <details className="group cursor-pointer">
                      <summary className="flex items-center gap-1 text-sm text-teal-700">
                        {u.current_loans.length} loan(s)
                        <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                      </summary>

                      <div className="mt-1 space-y-1">
                        {u.current_loans.map((loan: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-[#FDF6EE] px-2 py-1 text-xs leading-tight"
                          >
                            <p className="font-medium leading-tight">
                              {loan.type}
                            </p>
                            <p className="leading-tight">
                              EMI: ₹{loan.emi.toLocaleString()}
                            </p>
                            <p className="leading-tight">
                              Outstanding: ₹{loan.outstanding.toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : (
                    <span className="text-sm text-gray-500">No loans</span>
                  )}
                </TableCell>

                {/* Limit */}
                <TableCell className="text-right font-bold text-teal-700">
                  ₹{u.pre_approved_limit.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
