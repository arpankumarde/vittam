"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { getAssetUrl } from "@/lib/storage";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 flex h-16 items-center">
        {/* Logo */}
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

        {/* Desktop Nav & Actions */}
        <div className="ml-auto flex items-center gap-4 lg:gap-8">
          <nav className="hidden md:flex gap-4 lg:gap-8 items-center">
            <Link
              href="/solutions"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="/resources"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Resources
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              CRM
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* <Button
              variant="outline"
              className="hidden md:flex font-medium text-muted-foreground hover:text-primary"
            >
              Sign In
            </Button> */}
            <Button
              variant="outline"
              className="hidden md:flex font-medium border-2 border-teal-800/60"
            >
              <Link href="/contact">Book a Demo</Link>
            </Button>
            <Button className="hidden md:flex font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open menu"
              type="button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={true}>
        <SheetContent side="right" className="z-[19999999]">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-8 px-4">
            <Link
              href="/solutions"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </Link>
            <Link
              href="/resources"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Resources
            </Link>
            <Link
              href="/about"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/crm"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              CRM
            </Link>
            <Link
              href="/contact"
              className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-start font-medium text-muted-foreground hover:text-primary"
              >
                Sign In
              </Button>
              <Button className="w-full font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Book a Demo
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};
