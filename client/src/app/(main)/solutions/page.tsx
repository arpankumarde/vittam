import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Files,
  FileCheck,
} from "lucide-react";

export default function SolutionsPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Solutions</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tailored AI agents for every stage of the loan lifecycle.
        </p>
      </div>

      <div className="space-y-24 max-w-6xl mx-auto">
        {/* Master Agent */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
              <BrainCircuit className="mr-2 h-3.5 w-3.5" />
              Master Agent (Orchestrator)
            </div>
            <h2 className="text-3xl font-bold mb-4">
              The Central Command Center
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Master Agent is the first point of contact when customers land
              on your web chatbot via digital ads or marketing emails. It
              manages the entire conversation flow, understands customer needs,
              and convinces them to take a personal loan through personalized,
              persuasive dialogue.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              Acting as the main orchestrator, it intelligently hands over tasks
              to specialized Worker Agents and coordinates the entire workflow.
              The Master Agent starts and ends the conversation, ensuring a
              seamless experience from initial engagement to final closure.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-primary h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Manages conversation flow with customers landing from
                  ads/emails
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-primary h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Understands customer needs and persuades them to take loans
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-primary h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Orchestrates multiple Worker Agents for verification,
                  underwriting, and sanction
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-primary h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Handles edge cases like rejections or additional verification
                  seamlessly
                </span>
              </li>
            </ul>
            <Button>Learn More</Button>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-primary/5 to-secondary/50 rounded-3xl h-[400px] w-full flex items-center justify-center border border-border/50">
            <BrainCircuit className="h-40 w-40 text-primary/20" />
          </div>
        </div>

        {/* Sales Agent */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl h-[400px] w-full flex items-center justify-center border border-border/50">
            <MessageSquareText className="h-40 w-40 text-green-500/20" />
          </div>
          <div>
            <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 mb-4">
              <MessageSquareText className="mr-2 h-3.5 w-3.5" />
              Sales Agent
            </div>
            <h2 className="text-3xl font-bold mb-4">
              The Persuasive Negotiator
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Sales Agent specializes in discovering customer needs,
              negotiating loan terms, and driving commitment. It engages in
              human-like conversations to discuss loan amount, tenure, and
              interest rates, working to convert prospects into committed
              customers.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              This agent uses sophisticated persuasion techniques to address
              customer concerns, highlight benefits, and create urgency. It
              negotiates terms that work for both the customer and the NBFC,
              ensuring high conversion rates while maintaining customer
              satisfaction.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-green-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Discovers and understands customer needs through conversation
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-green-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Negotiates loan terms including amount, tenure, and interest
                  rates
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-green-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Uses persuasive techniques to drive customer commitment
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-green-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Handles objections and builds trust throughout the
                  conversation
                </span>
              </li>
            </ul>
            <Button variant="outline">View Details</Button>
          </div>
        </div>

        {/* Verification Agent */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 mb-4">
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Verification Agent
            </div>
            <h2 className="text-3xl font-bold mb-4">The KYC Validator</h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Verification Agent handles all KYC (Know Your Customer)
              verification tasks. It confirms customer details like phone number
              and address by querying a dummy CRM server, ensuring that the
              customer&apos;s identity matches the records.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              This agent also manages phone and OTP validation processes,
              providing secure verification without manual intervention. It
              works seamlessly with the Master Agent to ensure verification
              happens at the right moment in the customer journey.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-blue-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Confirms KYC details (phone, address) from CRM server
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-blue-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>Handles phone number verification</span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-blue-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>Manages OTP validation processes</span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-blue-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Ensures data accuracy before proceeding to underwriting
                </span>
              </li>
            </ul>
            <Button>Learn More</Button>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl h-[400px] w-full flex items-center justify-center border border-border/50">
            <ShieldCheck className="h-40 w-40 text-blue-500/20" />
          </div>
        </div>

        {/* Underwriting Agent */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl h-[400px] w-full flex items-center justify-center border border-border/50">
            <Files className="h-40 w-40 text-orange-500/20" />
          </div>
          <div>
            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 mb-4">
              <Files className="mr-2 h-3.5 w-3.5" />
              Underwriting Agent
            </div>
            <h2 className="text-3xl font-bold mb-4">The Risk Assessor</h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Underwriting Agent is responsible for credit evaluation and
              risk assessment. It fetches a dummy credit score (out of 900) from
              a mock credit bureau API and applies intelligent validation rules
              to determine loan eligibility.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              This agent implements a three-tier approval system: instant
              approval for low-risk applications, salary slip verification for
              medium-risk cases, and automatic rejection for high-risk
              scenarios. It ensures that expected EMI doesn&apos;t exceed 50% of
              the customer&apos;s salary and that credit scores meet the minimum
              threshold of 700.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-orange-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Fetches credit score (out of 900) from credit bureau API
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-orange-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Instant approval if loan amount ≤ pre-approved limit
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-orange-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Requests salary slip upload if amount ≤ 2× pre-approved limit
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-orange-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Approves only if expected EMI ≤ 50% of salary and credit score
                  ≥ 700
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-orange-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Rejects if amount {`>`} 2× pre-approved limit or credit score{" "}
                  {`<`} 700
                </span>
              </li>
            </ul>
            <Button variant="outline">View API Docs</Button>
          </div>
        </div>

        {/* Sanction Letter Agent */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 mb-4">
              <FileCheck className="mr-2 h-3.5 w-3.5" />
              Sanction Letter Generator
            </div>
            <h2 className="text-3xl font-bold mb-4">The Document Creator</h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Sanction Letter Generator Agent automatically creates
              professional PDF sanction letters once all conditions are met and
              the loan is approved. It generates compliant documents with all
              necessary terms, conditions, and disbursement details.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              This agent ensures that every approved loan receives a complete,
              legally compliant sanction letter instantly, eliminating the need
              for manual document preparation. The generated PDFs include loan
              amount, interest rate, tenure, EMI details, and all relevant terms
              and conditions.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-purple-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Generates automated PDF sanction letters upon approval
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-purple-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Includes all loan terms, conditions, and disbursement details
                </span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-purple-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>Ensures compliance with regulatory requirements</span>
              </li>
              <li className="flex items-start text-foreground/80">
                <CheckCircle2 className="text-purple-600 h-5 w-5 mr-3 mt-0.5 shrink-0" />{" "}
                <span>
                  Delivers documents instantly to complete the customer journey
                </span>
              </li>
            </ul>
            <Button>Learn More</Button>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl h-[400px] w-full flex items-center justify-center border border-border/50">
            <FileCheck className="h-40 w-40 text-purple-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
