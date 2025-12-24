import { Button } from "@/components/ui/button";
import { FileText, Download, PlayCircle } from "lucide-react";
import Link from "next/link";

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Resources</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, guides, and reports to help you navigate the future of
          lending.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-48 bg-yellow-900/80 flex items-center justify-center">
            <FileText className="h-16 w-16 text-muted" />
          </div>
          <div className="p-6">
            <div className="text-sm text-primary font-medium mb-2">
              Whitepaper
            </div>
            <h3 className="text-xl font-bold mb-2">
              The Future of AI in NBFCs
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              Explore how multi-agent systems are redefining customer
              acquisition costs and operational efficiency in the lending
              sector.
            </p>
            <Button variant="link" className="px-0" asChild>
              <Link href="#">Read Now &rarr;</Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-48 bg-yellow-900/80 flex items-center justify-center">
            <PlayCircle className="h-16 w-16 text-muted" />
          </div>
          <div className="p-6">
            <div className="text-sm text-primary font-medium mb-2">Webinar</div>
            <h3 className="text-xl font-bold mb-2">Vittam Product Demo</h3>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              Watch a live walkthrough of the Vittam platform, from customer
              onboarding to final sanction letter generation.
            </p>
            <Button variant="link" className="px-0" asChild>
              <Link
                href="https://drive.google.com/file/d/1C7QFK51AdeiBG9MKsktJrdBtq1d8qsjW/view"
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch Now &rarr;
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-48 bg-yellow-900/80 flex items-center justify-center">
            <Download className="h-16 w-16 text-muted" />
          </div>
          <div className="p-6">
            <div className="text-sm text-primary font-medium mb-2">
              Case Study
            </div>
            <h3 className="text-xl font-bold mb-2">
              How Tata Capital Scaled 3x
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              Learn how a leading NBFC used Vittam to increase their monthly
              loan volume from 10k to 30k without adding staff.
            </p>
            <Button variant="link" className="px-0" asChild>
              <Link href="#">Download PDF &rarr;</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
