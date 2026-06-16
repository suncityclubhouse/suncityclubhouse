import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFacilities } from "@/actions/facilities";
import { StatusBadge } from "@/components/shared/StatusBadge";
import Image from "next/image";

export const metadata: Metadata = { title: "Facilities | Admin" };

export default async function FacilitiesPage() {
  const facilities = await getFacilities(true); // include inactive

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Facilities</h1>
          <p className="text-sm text-stone-500 mt-1">{facilities.length} facilities configured</p>
        </div>
        <Button asChild style={{ backgroundColor: "#08428C" }} className="text-white gap-2">
          <Link href="/dashboard/facilities/new">
            <Plus className="w-4 h-4" />
            Add Facility
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilities.map((f) => (
          <div key={f.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
            <div className="relative h-40 bg-stone-100">
              {f.thumbnail_url ? (
                <Image src={f.thumbnail_url} alt={f.name} fill sizes="400px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl font-serif">
                  {f.name.charAt(0)}
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  f.status === "active" ? "bg-emerald-100 text-emerald-700" :
                  f.status === "maintenance" ? "bg-amber-100 text-amber-700" :
                  "bg-stone-100 text-stone-600"
                }`}>
                  {f.status}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-stone-900 mb-1">{f.name}</h3>
              <p className="text-xs text-stone-500 capitalize mb-3">{f.category}</p>
              <p className="text-xs text-stone-400 line-clamp-2 mb-4">{f.short_description ?? f.description}</p>
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href={`/dashboard/facilities/${f.id}/edit`}>
                  <Settings className="w-3.5 h-3.5" />
                  Manage
                </Link>
              </Button>
            </div>
          </div>
        ))}

        {facilities.length === 0 && (
          <div className="col-span-full text-center py-16 text-stone-400">
            <p className="text-lg mb-2">No facilities yet</p>
            <Button asChild style={{ backgroundColor: "#08428C" }} className="text-white">
              <Link href="/dashboard/facilities/new">Add your first facility</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
