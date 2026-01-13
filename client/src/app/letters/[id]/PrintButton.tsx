"use client";

import { Button } from "@/components/ui/button";

export default function PrintButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const handlePrint = () => {
    window.print();
  };

  return <Button onClick={handlePrint}>{children}</Button>;
}
