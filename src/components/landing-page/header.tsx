import { ArrowRight } from "lucide-react";
import { segments } from "@/config/segments";
import { VorcleLogoMain } from "../custom-icons/brand-logo";
import Link from "next/link";

const MENU_ITEMS = [
  { name: "Product", href: "#" },
  { name: "Features", href: "#" },
  { name: "Careers", href: "#" },
  { name: "Pricing", href: "#" },
];

export default function Header() {
  return (
    <header className="bg-background fixed top-0 w-full z-50 border-b py-4 grid grid-cols-[1fr_calc(100%-2rem)_1fr] md:grid-cols-[1fr_min(calc(100%-5rem),calc(1200/16*1rem))_1fr]">
      <nav
        aria-label="global"
        className="flex items-center justify-between col-[2]"
      >
        <div className="flex">
          <a href={segments.home}>
            <VorcleLogoMain />
            <span className="sr-only">Vorcle</span>
          </a>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {MENU_ITEMS.map((item) => (
            <a key={item.name} href={item.href} className="text-sm">
              {item.name}
            </a>
          ))}
        </div>

        <Link
          href={segments.signIn}
          className="hidden md:inline-flex items-center gap-1 group text-sm"
          aria-label="go to log in page"
        >
          <span className="group-hover:text-deep-saffron">Log in</span>
          <ArrowRight
            className="size-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition -translate-x-1.5 will-change-transform group-hover:text-deep-saffron"
            aria-hidden="true"
          />
        </Link>
      </nav>
    </header>
  );
}
