import { Button } from "@/components/ui/button";
import { BentoGrid, BentoGridItem } from "@/components/marketing/bento-grid";
import { 
  Bot, 
  BrainCircuit, 
  FileCheck, 
  Files, 
  Globe, 
  MessageSquareText, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/40 via-background to-background"></div>
        
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span>Revolutionizing NBFC Sales</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight">
            From Application to Sanction in <span className="text-primary relative inline-block">
              Minutes
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Vittam&apos;s AI-driven multi-agent system automates the entire personal loan journey, boosting conversions by 50-83%.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300">
              Book a Demo
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full hover:bg-secondary/50 transition-all duration-300">
              View Solutions
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-3xl bg-card border border-border/50 p-8 shadow-sm">
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-primary">5m</div>
            <div className="text-sm font-medium text-muted-foreground">Processing Time</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-primary">83%</div>
            <div className="text-sm font-medium text-muted-foreground">Higher Conversions</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-primary">60%</div>
            <div className="text-sm font-medium text-muted-foreground">Cost Reduction</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-4xl md:text-5xl font-bold text-primary">24/7</div>
            <div className="text-sm font-medium text-muted-foreground">Availability</div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Bento Grid */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Your New Sales Workforce</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A coordinated team of AI agents working in perfect sync to handle every aspect of the loan process.
          </p>
        </div>

        <BentoGrid className="max-w-6xl mx-auto">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={i === 0 || i === 3 ? "md:col-span-2" : ""}
            />
          ))}
        </BentoGrid>
      </section>

      {/* Benefits Section */}
      <section className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
               <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                 Why Leading NBFCs Choose Vittam
               </h2>
               <div className="space-y-6">
                 <div className="flex gap-4">
                   <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                     <TrendingUp className="text-primary h-6 w-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold mb-2">Maximize Revenue</h3>
                     <p className="text-muted-foreground">Scale loan volume by 2-3x without increasing headcount. Our agents never sleep and never miss a lead.</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-4">
                   <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                     <ShieldCheck className="text-primary h-6 w-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold mb-2">Risk-Aware Automation</h3>
                     <p className="text-muted-foreground">Intelligent underwriting that adheres to your risk policies, instantly filtering high-risk applications.</p>
                   </div>
                 </div>

                 <div className="flex gap-4">
                   <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                     <Users className="text-primary h-6 w-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold mb-2">Human-like Persuasion</h3>
                     <p className="text-muted-foreground">Sophisticated conversational AI that understands context, negotiates terms, and drives commitment.</p>
                   </div>
                 </div>
               </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl transform rotate-3 scale-95 blur-xl"></div>
              <div className="relative bg-card border border-border/50 rounded-3xl p-8 shadow-2xl">
                 <div className="flex items-center justify-between mb-8 border-b border-border/30 pb-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="text-primary h-6 w-6" />
                       </div>
                       <div>
                          <div className="font-bold">Sales Agent</div>
                          <div className="text-xs text-green-500 flex items-center gap-1">
                             <span className="block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                             Active Now
                          </div>
                       </div>
                    </div>
                    <div className="text-xs text-muted-foreground">09:42 AM</div>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                    <div className="bg-secondary/50 p-3 rounded-2xl rounded-tl-none max-w-[85%] self-start">
                       <p className="text-sm">Hi Rahul! I see you&apos;re looking for a personal loan of ₹5 Lakhs. I can get that approved for you in just 5 minutes. Are you interested?</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-2xl rounded-tr-none max-w-[85%] ml-auto text-right">
                       <p className="text-sm text-foreground">Yes, but I&apos;m worried about the interest rate.</p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded-2xl rounded-tl-none max-w-[85%] self-start">
                       <p className="text-sm">I understand. Based on your profile, I can offer you a special rate of 10.5% if we complete the application now. That&apos;s lower than the standard 11.2%. Shall we proceed?</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-secondary/30 rounded-full"></div>
                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                       <Zap className="text-white h-4 w-4" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Challenge NBFCs Face</h2>
            <p className="text-lg text-muted-foreground">
              Traditional loan processing is slow, expensive, and loses customers at every step.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-destructive/20 p-6 rounded-2xl">
              <div className="text-5xl font-bold text-destructive mb-2">70%</div>
              <h3 className="font-bold mb-2">Application Abandonment</h3>
              <p className="text-sm text-muted-foreground">Customers drop off due to lengthy processes and lack of guidance.</p>
            </div>
            <div className="bg-card border border-destructive/20 p-6 rounded-2xl">
              <div className="text-5xl font-bold text-destructive mb-2">48+ hrs</div>
              <h3 className="font-bold mb-2">Processing Delays</h3>
              <p className="text-sm text-muted-foreground">Manual verification and underwriting take days, losing competitive edge.</p>
            </div>
            <div className="bg-card border border-destructive/20 p-6 rounded-2xl">
              <div className="text-5xl font-bold text-destructive mb-2">3-5%</div>
              <h3 className="font-bold mb-2">Low Conversion</h3>
              <p className="text-sm text-muted-foreground">Poor conversion rates from digital channels due to impersonal interfaces.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Vittam Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A seamless journey from first contact to sanction letter in minutes.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {[
              { step: "1", title: "Customer Engagement", desc: "Customer lands from ad/email into our conversational interface. Master Agent greets and qualifies the lead.", icon: Globe },
              { step: "2", title: "Intelligent Routing", desc: "Master Agent assesses needs and hands off to specialized Worker Agents for verification and underwriting.", icon: BrainCircuit },
              { step: "3", title: "Smart Decisioning", desc: "Conditional logic: auto-approve low-risk, request salary slip for medium-risk, reject high-risk applications.", icon: ShieldCheck },
              { step: "4", title: "Instant Delivery", desc: "Sanction letter generated and delivered instantly. Chat closes with complete customer satisfaction.", icon: FileCheck },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg shadow-primary/20">
                  {item.step}
                </div>
                <div className="flex-1 bg-card border border-border/50 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Leading NBFCs</h2>
          <p className="text-lg text-muted-foreground">
            See what industry leaders are saying about Vittam.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">TC</span>
              </div>
              <div>
                <div className="font-bold">Rajesh Kumar</div>
                <div className="text-sm text-muted-foreground">Head of Digital, Tata Capital</div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              &ldquo;Vittam transformed our loan processing. We&apos;ve reduced processing time from 2 days to under 5 minutes, and our conversion rates have improved by 83%. The multi-agent system handles everything seamlessly.&rdquo;
            </p>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">NB</span>
              </div>
              <div>
                <div className="font-bold">Priya Sharma</div>
                <div className="text-sm text-muted-foreground">VP Operations, Leading NBFC</div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              &ldquo;The ROI has been incredible. We&apos;ve scaled our monthly loan volume from 10K to 30K applications without adding a single person to our team. Vittam&apos;s agents work 24/7 and never miss a lead.&rdquo;
            </p>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-secondary/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Seamless Integrations</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Vittam integrates with your existing infrastructure, including CRM systems, credit bureaus, and document storage solutions.
              </p>
              <div className="space-y-4">
                {["CRM Integration", "Credit Bureau APIs", "Document Storage", "Offer Mart Server", "KYC Verification"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-3xl p-12 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-6">
                {["CRM", "API", "Docs"].map((label, i) => (
                  <div key={i} className="h-20 w-20 bg-secondary/50 rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Automate Your Loan Sales?</h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl mb-10">
              Join leading NBFCs in the AI revolution. Reduce costs, increase conversions, and delight your customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full font-bold">
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const items = [
  {
    title: "Master Orchestrator",
    description: "The brain of the operation. It manages customer conversations, assesses needs, and intelligently routes tasks to specialized worker agents for seamless handling.",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 border border-transparent dark:border-white/[0.2] items-center justify-center"><BrainCircuit className="h-14 w-14 text-neutral-400" /></div>,
    icon: <BrainCircuit className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Sales Agent",
    description: "Discovers needs, negotiates terms, and drives commitment with human-like persuasion strategies.",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-50 to-green-100 items-center justify-center"><MessageSquareText className="h-10 w-10 text-green-500/50" /></div>,
    icon: <MessageSquareText className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Verification Agent",
    description: "Instantly confirms KYC via CRM lookups and handles phone/OTP validation securely.",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 items-center justify-center"><ShieldCheck className="h-10 w-10 text-blue-500/50" /></div>,
    icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Underwriting Agent",
    description: "Fetches credit scores, applies risk rules, and makes instant approval decisions based on pre-set criteria, handling salary checks for higher amounts.",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 items-center justify-center"><Files className="h-10 w-10 text-orange-500/50" /></div>,
    icon: <Files className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Sanction Letter Agent",
    description: "Generates professional, compliant PDF sanction letters with all terms and disbursement details instantly upon approval.",
    header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 items-center justify-center"><FileCheck className="h-10 w-10 text-purple-500/50" /></div>,
    icon: <FileCheck className="h-4 w-4 text-neutral-500" />,
  },
];
