import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const Header = () => {
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
             <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
             <Button variant="ghost" className="hidden md:flex font-medium text-muted-foreground hover:text-primary">Sign In</Button>
             <Button className="font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">Book a Demo</Button>
             <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
             </Button>
          </div>
       </div>
    </header>
  )
}

