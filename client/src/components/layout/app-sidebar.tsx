"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShieldCheck, CreditCard, FileCheck, User, Settings2 } from "lucide-react";
import { RxDashboard } from "react-icons/rx";
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
import Image from "next/image";
import { getAssetUrl } from "@/lib/storage";

const items = [
  { id: "home", label: "Home", icon: RxDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "kyc", label: "KYC Details", icon: ShieldCheck },
  { id: "offers", label: "Offers", icon: CreditCard },
  { id: "sanctions", label: "Sanctions", icon: FileCheck },
  { id: "configuration", label: "Configuration", icon: Settings2 },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const active = pathname.split("/")[2] || "home";
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getSessionCookie();
      if (user) {
        setUser(JSON.parse(user as string));
      } else {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <Sidebar className="border-gray-800/30">
      <SidebarHeader className="h-16 flex justify-center px-4 border-b border-gray-800/30">
        <Link href="/" className="flex justify-center items-center">
          <Image
            src={getAssetUrl("logo.png")}
            alt="Vittam"
            width={100}
            height={80}
            className="object-contain"
            unoptimized
          />
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
                className={`px-4 hover:bg-gray-300 active:bg-gray-300 transition-colors duration-200 ${
                  active === id ? "!text-white shadow-xl" : ""
                }`}
              >
                <Link href={`/dashboard/${id}`}>
                  <Icon className="!size-5" />
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <div className="flex items-center gap-2 h-14 bg-gray-300/50 rounded-lg px-4">
            <User className="size-8 rounded-full bg-white p-1" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground">
                {user?.email || "user@example.com"}
              </span>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
};

export default AppSidebar;
