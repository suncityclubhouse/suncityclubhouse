import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Users, MapPin, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FacilityGallery } from "@/components/public/FacilityGallery";
import { PricingCard } from "@/components/public/PricingCard";
import { getFacilityBySlug } from "@/actions/facilities";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) return { title: "Facility Not Found" };

  return {
    title: `${facility.name} | Clubhouse Booking`,
    description: facility.short_description ?? facility.description ?? undefined,
    openGraph: {
      title: facility.name,
      description: facility.short_description ?? undefined,
      images: facility.thumbnail_url ? [facility.thumbnail_url] : [],
    },
  };
}

export default async function FacilityDetailPage({ params }: Props) {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);

  if (!facility || facility.status !== "active") notFound();

  const activePackages = facility.facility_packages.filter((p) => p.is_active);
  const media = facility.facility_media;

  const bookingCta = (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <p className="text-sm text-slate-500 mb-1">Starting from</p>
        {activePackages.length > 0 ? (
          <p className="text-3xl font-bold text-slate-900">
            ₹{Math.min(...activePackages.map((p) => p.price)).toLocaleString("en-IN")}
          </p>
        ) : (
          <p className="text-slate-400 text-sm italic">Contact for pricing</p>
        )}
      </div>

      <Separator />

      {/* Quick info */}
      <div className="space-y-2.5 text-sm text-slate-600">
        {facility.max_capacity && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Up to {facility.max_capacity} guests
          </div>
        )}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Online booking — no registration needed
        </div>
      </div>

      <Button
        asChild
        className="w-full py-5 text-base font-semibold text-white rounded-xl"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
      >
        <Link href={`/facilities/${facility.slug}/book`}>
          Book Now
        </Link>
      </Button>

      <p className="text-xs text-center text-slate-400">
        Slot confirmed only after payment verification
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/#facilities" className="hover:text-slate-600 transition-colors">Facilities</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">{facility.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — gallery + details */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          {/* Gallery */}
          <div className="order-1">
            {media.length > 0 ? (
              <FacilityGallery media={media} facilityName={facility.name} />
            ) : (
              <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center">
                <span className="text-slate-300 text-6xl font-serif">{facility.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="order-2 lg:hidden">
            {bookingCta}
          </div>

          {/* Facility info */}
          <div className="order-3">
            <div className="flex flex-wrap gap-4 items-start justify-between mb-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full capitalize">
                  {facility.category}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
                  {facility.name}
                </h1>
              </div>
            </div>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
              {facility.max_capacity && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Up to {facility.max_capacity} guests
                </div>
              )}
            </div>

            <Separator className="mb-6" />

            {/* Description */}
            {facility.description && (
              <div className="prose prose-slate max-w-none mb-8">
                <h2 className="font-serif text-xl font-semibold text-slate-900 mb-3">About this Facility</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{facility.description}</p>
              </div>
            )}

            {/* Rules */}
            {facility.rules && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h2 className="font-serif text-xl font-semibold text-slate-900 mb-3">Rules &amp; Terms</h2>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {facility.rules}
                </div>
              </div>
            )}
          </div>

          {/* Pricing section */}
          {activePackages.length > 0 && (
            <div className="order-4">
              <h2 className="font-serif text-2xl font-semibold text-slate-900 mb-5">Pricing &amp; Packages</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activePackages.map((pkg) => (
                  <PricingCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — sticky booking CTA (Desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24">
            {bookingCta}
          </div>
        </div>
      </div>
    </div>
  );
}
