import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-secondary/30 border-t py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
           <div className="flex items-center space-x-2">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">V</span>
             </div>
             <span className="text-xl font-bold tracking-tight text-foreground">Vittam</span>
           </div>
           <p className="text-sm text-muted-foreground leading-relaxed">
             AI-driven sales automation for NBFCs. Accelerating personal loans from days to minutes with intelligent multi-agent orchestration.
           </p>
           <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={20} /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin size={20} /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></Link>
           </div>
        </div>
        
        <div>
           <h3 className="font-semibold mb-6 text-foreground">Product</h3>
           <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/solutions" className="hover:text-primary transition-colors">Solutions</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
           </ul>
        </div>

        <div>
           <h3 className="font-semibold mb-6 text-foreground">Company</h3>
           <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
           </ul>
        </div>

        <div>
           <h3 className="font-semibold mb-6 text-foreground">Legal</h3>
           <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
           </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
         © {new Date().getFullYear()} Vittam. All rights reserved.
      </div>
    </footer>
  )
}

