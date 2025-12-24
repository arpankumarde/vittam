import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground mb-10">
            Ready to transform your lending process? Our team is here to help
            you get started.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Email</h3>
                <p className="text-muted-foreground">sales@vittam.ai</p>
                <p className="text-muted-foreground">support@vittam.ai</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Phone</h3>
                <p className="text-muted-foreground">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Office</h3>
                <p className="text-muted-foreground">
                  12th Floor, Tech Park,
                  <br />
                  Bangalore, Karnataka - 560102
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input placeholder="john@company.com" type="email" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Tell us about your requirements..."
                className="min-h-[150px]"
              />
            </div>

            <Button className="w-full" size="lg">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
