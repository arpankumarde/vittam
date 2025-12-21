"use client"

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
       <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-lg">V</span>
             </div>
             <span className="text-xl font-bold tracking-tight text-foreground">Vittam</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 items-center">
             <Link href="/solutions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solutions</Link>
             <Link href="/resources" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Resources</Link>
             <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
             <Link href="/crm" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">CRM Dashboard</Link>
             <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
             <Button variant="ghost" className="hidden md:flex font-medium text-muted-foreground hover:text-primary">Sign In</Button>
             <Button className="hidden md:flex font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">Book a Demo</Button>
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

       {/* Mobile Menu */}
       <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={true}>
         <SheetContent side="right" className="w-[300px] sm:w-[400px] z-[100]">
           <SheetHeader>
             <SheetTitle>Menu</SheetTitle>
           </SheetHeader>
           <nav className="flex flex-col gap-4 mt-8">
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
               CRM Dashboard
             </Link>
             <Link 
               href="/contact" 
               className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
               onClick={() => setMobileMenuOpen(false)}
             >
               Contact
             </Link>
             <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
               <Button variant="ghost" className="w-full justify-start font-medium text-muted-foreground hover:text-primary">
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
  )
}

