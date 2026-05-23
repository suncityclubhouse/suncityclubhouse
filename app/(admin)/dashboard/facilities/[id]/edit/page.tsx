import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFacilityById } from "@/actions/facilities";
import { FacilityForm } from "@/components/admin/FacilityForm";

export const metadata: Metadata = { title: "Edit Facility | Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage({ params }: Props) {
  const { id } = await params;
  const facility = await getFacilityById(id);
  if (!facility) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Edit Facility</h1>
        <p className="text-sm text-stone-500 mt-1">{facility.name}</p>
      </div>
      <FacilityForm facility={facility} isEdit />
    </div>
  );
}
