import type { Metadata } from "next";
import { FacilityForm } from "@/components/admin/FacilityForm";

export const metadata: Metadata = { title: "New Facility | Admin" };

export default function NewFacilityPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-stone-900">Add Facility</h1>
        <p className="text-sm text-stone-500 mt-1">Create a new bookable facility</p>
      </div>
      <FacilityForm />
    </div>
  );
}
