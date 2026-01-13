"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";

interface PrintButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export default function PrintButton({ children, ...props }: PrintButtonProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <Button {...props} onClick={handlePrint}>
            {children}
        </Button>
    );
}
