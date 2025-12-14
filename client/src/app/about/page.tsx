import { Button } from "@/components/ui/button";
import { Users, Target, Rocket, Award, Heart, Lightbulb, Linkedin, Mail } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About Vittam</h1>
        <p className="text-xl text-muted-foreground">
          We are on a mission to transform how financial institutions engage with their customers.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Mission</h2>
          <div className="bg-card border border-border/50 rounded-3xl p-12 shadow-sm">
            <p className="text-lg text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              To revolutionize the lending industry by making personal loans accessible, fast, and delightful. We believe every customer deserves a seamless experience, and every NBFC deserves technology that scales without limits.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Customer First</h3>
            <p className="text-muted-foreground">
              We believe in creating technology that enhances human connection, not replaces it. Our agents are designed to be helpful, empathetic, and efficient.
            </p>
          </div>
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Precision & Speed</h3>
            <p className="text-muted-foreground">
              In the financial world, speed is currency. We reduce loan processing times from days to minutes without compromising on accuracy or risk.
            </p>
          </div>
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Innovation</h3>
            <p className="text-muted-foreground">
              We are constantly pushing the boundaries of what AI can do in the BFSI sector, setting new standards for automation and efficiency.
            </p>
          </div>
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Excellence</h3>
            <p className="text-muted-foreground">
              We strive for excellence in everything we do, from code quality to customer support. Every interaction matters.
            </p>
          </div>
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Integrity</h3>
            <p className="text-muted-foreground">
              Trust is the foundation of financial services. We build secure, compliant solutions that protect both our clients and their customers.
            </p>
          </div>
          <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="text-primary h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Continuous Learning</h3>
            <p className="text-muted-foreground">
              The AI landscape evolves rapidly. We stay ahead by continuously learning, iterating, and improving our solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="mb-20">
        <div className="bg-secondary/30 rounded-3xl p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Our Story</h2>
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Vittam was born out of a simple observation: while the world was moving towards instant gratification, getting a loan was still a painful, multi-day process involving endless paperwork and phone tag. We saw an opportunity to use advanced AI agents to bridge this gap, creating a seamless bridge between NBFCs and their customers.
            </p>
            <p>
              Founded in 2024, our team of AI researchers, financial services experts, and engineers came together with a shared vision: to make loan processing as fast and intuitive as ordering food online. We spent months understanding the pain points of both NBFCs and their customers, studying workflows, and designing an agentic system that could handle the complexity of financial decision-making.
            </p>
            <p>
              Today, Vittam powers loan sales for leading NBFCs across India, processing thousands of applications daily with unprecedented speed and accuracy. But we're just getting started. Our mission is to expand beyond personal loans, bringing the same level of automation and intelligence to home loans, auto loans, and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm text-center">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">AK</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Arjun Kumar</h3>
            <p className="text-primary font-medium mb-4">Co-Founder & CEO</p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Arjun brings 15+ years of experience in financial services and AI. Previously led digital transformation initiatives at major NBFCs. Passionate about using technology to democratize access to credit.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm text-center">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">SM</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Sneha Mehta</h3>
            <p className="text-primary font-medium mb-4">Co-Founder & CTO</p>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Sneha is an AI researcher and engineer with expertise in multi-agent systems and NLP. Formerly at leading tech companies, she's built scalable AI solutions serving millions of users.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4">Join Us on This Journey</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion for transforming financial services.
          </p>
          <Button size="lg">View Open Positions</Button>
        </div>
      </section>
    </div>
  );
}

