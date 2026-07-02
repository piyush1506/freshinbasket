"use client";
import { usePathname } from "next/navigation";

export default function PageTransitionWrapper({ children }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="flex-grow flex flex-col animate-page-enter">
      {children}
    </div>
  );
}
