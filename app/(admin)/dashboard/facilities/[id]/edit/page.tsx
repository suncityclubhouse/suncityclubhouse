import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFacilityById } from "@/actions/facilities";
import { FacilityForm } from "@/components/admin/FacilityForm";
import { PackageManager } from "@/components/admin/PackageManager";
import { MediaManager } from "@/components/admin/MediaManager";

export const metadata: Metadata = { title: "Edit Facility | Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage({ params }: Props) {
  const { id } = await params;
  const facility = await getFacilityById(id);
  if (!facility) notFound();

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Edit Facility</h1>
        <p className="text-sm text-stone-500 mt-1">{facility.name}</p>
      </div>

      {/* Basic details form */}
      <FacilityForm facility={facility} isEdit />

      {/* Pricing packages — only available after facility is created */}
      <div>
        <div className="mb-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900">Pricing & Packages</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Add pricing tiers that customers see when booking this facility.
          </p>
        </div>
        <PackageManager
          facilityId={facility.id}
          initialPackages={facility.facility_packages ?? []}
        />
      </div>

      {/* Media gallery */}
      <div>
        <div className="mb-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900">Photo Gallery</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Upload photos and videos that users see when they view this facility. The first image is the cover.
          </p>
        </div>
        <MediaManager
          facilityId={facility.id}
          initialMedia={facility.facility_media ?? []}
        />
      </div>
    </div>
  );
}
