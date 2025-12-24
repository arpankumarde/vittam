"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, CreditCard } from "lucide-react";

const items = [
  { id: "users", label: "Users", icon: Users },
  { id: "kyc", label: "KYC Details", icon: ShieldCheck },
  { id: "offers", label: "Offers", icon: CreditCard },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const active = pathname.split("/")[2] || "users";

  return (
    <div className="min-h-screen flex bg-[#FFF8F1]">
      <aside className="w-64 bg-[#FDF6EE] border-r p-4">
        <div className="mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-lg">
                V
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Vittam
            </span>
          </Link>
        </div>

        <div className="space-y-2">
          {items.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={"ghost"}
              size="lg"
              className={cn(
                "w-full flex justify-start gap-3 py-6 rounded-xl transition",
                active === id
                  ? "bg-teal-600 hover:bg-teal-600 text-white hover:text-white shadow"
                  : "hover:bg-teal-700/20 text-teal-700"
              )}
              asChild
            >
              <Link href={`/crm/${id}`}>
                <Icon className="size-5" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
