import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen">{children}</main>
      <Footer />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.process = window.process || { env: {} };
          `,
        }}
      />
      <script
        src={process.env.NEXT_PUBLIC_CHAT_WIDGET_URL!}
        data-bot-id="acme"
        data-position="bottom-right"
        data-width="360"
        data-height="520"
        defer
      />
    </>
  );
}
