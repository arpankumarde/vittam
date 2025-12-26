"use client";

import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

export default function HeroVideoSection() {
  return (
    <section className="container mx-auto px-4 pt-2 pb-24">
      <div className="max-w-5xl mx-auto">
         <div className="rounded-3xl overflow-hidden border shadow-xl bg-background">
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://drive.google.com/file/d/1C7QFK51AdeiBG9MKsktJrdBtq1d8qsjW/preview"
          thumbnailSrc="https://i.postimg.cc/L6qjKTyv/Vittam-Demo-Thumbnail.png"
          thumbnailAlt="Vittam product walkthrough"
          className="rounded-3xl border shadow-xl"
        />
      </div>
      </div>
    </section>
  );
}
