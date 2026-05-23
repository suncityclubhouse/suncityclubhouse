import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { ScrollAnimator } from "@/components/public/ScrollAnimator";

export const metadata: Metadata = {
  title: "Suncity Clubhouse — Premium Facility Booking",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <ScrollAnimator />
      <main className="min-h-screen pt-16">{children}</main>
    </>
  );
}
