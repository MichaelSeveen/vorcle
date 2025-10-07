import React from "react";
import { VorcleLogoMain } from "../custom-icons/brand-logo";
import { segments } from "@/config/segments";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FooterSection() {
  const date = new Date();

  return (
    <footer>
      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="h-15 md:h-18 lg:h-30 border-x" />
      </div>
      <div className="border-b">
        <div className="border-x w-full max-w-[calc(100%-2rem)] md:max-w-[min(calc(100%-5rem),calc(1200/16*1rem))] mx-auto h-[20rem] lg:h-[30rem] p-4 md:p-6">
          <div className="relative flex flex-col justify-between h-full">
            <VorcleLogoMain />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <h2 className="text-2xl md:text-3xl lg:text-5xl tracking-tight font-semibold text-pretty md:col-span-2 text-muted-foreground">
                Clarity in every conversation that matters
              </h2>
              <div className="md:self-center">
                <Link
                  aria-label="go to log in page"
                  href={segments.signIn}
                  className="w-fit px-8 py-3 inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-deep-saffron text-muted"
                >
                  Try vorcle for free
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr] [&>*]:col-[2] border-b">
        <div className="flex items-center h-15 md:h-18 lg:h-20 border-x p-2">
          <p className="text-xs text-muted-foreground">
            &copy; Copyright Vorcle {date.getFullYear()}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
