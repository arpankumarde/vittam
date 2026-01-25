"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, CreditCard, FileCheck, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getSessionCookie } from "@/lib/cookie";
import { useEffect, useState } from "react";

const items = [
  { id: "users", label: "Users", icon: Users },
  { id: "kyc", label: "KYC Details", icon: ShieldCheck },
  { id: "offers", label: "Offers", icon: CreditCard },
  { id: "sanctions", label: "Sanctions", icon: FileCheck },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "users";
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getSessionCookie();
      setUser(JSON.parse(user as string));
    };
    fetchUser();
  }, [user]);

  return (
    <Sidebar className="border-gray-800/30">
      <SidebarHeader className="h-16 flex justify-center px-4 border-b border-gray-800/30">
        <Link href="/" className="flex items-center space-x-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Vittam</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4">
        <SidebarMenu>
          {items.map(({ id, label, icon: Icon }) => (
            <SidebarMenuItem key={id}>
              <SidebarMenuButton
                asChild
                isActive={active === id}
                size="lg"
                className={`px-4 ${active === id ? "!bg-teal-600 !text-white" : ""}`}
              >
                <Link href={`/dashboard/${id}`}>
                  <Icon className="size-5" />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <div className="flex items-center gap-2 h-14 bg-white rounded-lg px-4 border border-gray-200">
            <User className="size-8 rounded-full bg-gray-200 p-1" />
            <span>{user?.name}</span>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default AppSidebar;
