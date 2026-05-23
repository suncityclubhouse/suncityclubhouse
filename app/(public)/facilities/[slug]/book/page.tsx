import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BookingWizard } from "@/components/public/BookingWizard";
import { getFacilityBySlug } from "@/actions/facilities";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) return { title: "Book Facility" };
  return { title: `Book ${facility.name} | Clubhouse` };
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);

  if (!facility || facility.status !== "active") notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/facilities/${facility.slug}`} className="hover:text-stone-600 transition-colors">
          {facility.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-stone-700 font-medium">Book</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Book {facility.name}</h1>
        <p className="text-stone-500 text-sm">Complete the steps below to reserve your slot</p>
      </div>

      <BookingWizard facility={facility} />
    </div>
  );
}
