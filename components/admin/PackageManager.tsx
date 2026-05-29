"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Check,
  Clock, Calendar, Sun, Sunrise
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createFacilityPackage,
  updateFacilityPackage,
  deleteFacilityPackage,
} from "@/actions/facilities";
import type { FacilityPackage } from "@/types/database";

const packageSchema = z.object({
  name:          z.string().min(1, "Name required").max(80),
  type:          z.enum(["hourly", "half_day", "full_day", "monthly", "quarterly"]),
  price:         z.preprocess((val) => (val === "" || val === undefined || val === null) ? undefined : Number(val), z.number({ required_error: "Price required" }).min(0, "Price required")),
  durationHours: z.preprocess((val) => (val === "" || val === undefined || val === null) ? undefined : Number(val), z.number().int().min(1, "Must be at least 1").optional()),
  startTime:     z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  endTime:       z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  description:   z.preprocess((val) => (val === "" ? undefined : val), z.string().max(300).optional()),
  isActive:      z.boolean().default(true),
  displayOrder:  z.coerce.number().int().min(0).default(0),
});
type PackageFormValues = z.infer<typeof packageSchema>;

const TYPE_OPTIONS = [
  { value: "hourly",    label: "Hourly",     icon: Clock,    hint: "Charged per hour" },
  { value: "half_day",  label: "Half Day",   icon: Sunrise,  hint: "Fixed AM/PM slot" },
  { value: "full_day",  label: "Full Day",   icon: Sun,      hint: "Entire day" },
  { value: "monthly",   label: "Monthly",    icon: Calendar, hint: "30-day subscription" },
  { value: "quarterly", label: "Quarterly",  icon: Calendar, hint: "90-day subscription" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  hourly:    "bg-blue-50 text-blue-700 border-blue-200",
  half_day:  "bg-amber-50 text-amber-700 border-amber-200",
  full_day:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  monthly:   "bg-purple-50 text-purple-700 border-purple-200",
  quarterly: "bg-rose-50 text-rose-700 border-rose-200",
};

interface Props {
  facilityId: string;
  initialPackages: FacilityPackage[];
}

export function PackageManager({ facilityId, initialPackages }: Props) {
  const router = useRouter();
  const [packages, setPackages] = useState<FacilityPackage[]>(initialPackages);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      name: "", type: "hourly", price: 0,
      isActive: true, displayOrder: packages.length,
    },
  });

  const watchedType = form.watch("type");

  const openNew = () => {
    form.reset({
      name: "", type: "hourly", price: 0,
      isActive: true, displayOrder: packages.length,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (pkg: FacilityPackage) => {
    form.reset({
      name:          pkg.name,
      type:          pkg.type as any,
      price:         pkg.price,
      durationHours: pkg.duration_hours ?? undefined,
      startTime:     pkg.start_time ?? undefined,
      endTime:       pkg.end_time ?? undefined,
      description:   pkg.description ?? undefined,
      isActive:      pkg.is_active,
      displayOrder:  pkg.display_order,
    });
    setEditingId(pkg.id);
    setShowForm(true);
  };

  const onSubmit = async (values: PackageFormValues) => {
    try {
      if (editingId) {
        const result = await updateFacilityPackage(editingId, values);
        if (!result.success) { toast.error(result.error ?? "Failed to update"); return; }
        setPackages((prev) =>
          prev.map((p) => p.id === editingId ? { ...p, ...values, price: values.price } as any : p)
        );
        toast.success("Package updated!");
      } else {
        const result = await createFacilityPackage(facilityId, values);
        if (!result.success) { toast.error(result.error ?? "Failed to create"); return; }
        if (result.data) setPackages((prev) => [...prev, result.data!]);
        toast.success("Package added!");
      }
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteFacilityPackage(id);
      if (!result.success) { toast.error(result.error ?? "Failed to delete"); return; }
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package removed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div>
          <h2 className="font-medium text-stone-900">Pricing Packages</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {packages.length} package{packages.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {!showForm && (
          <Button onClick={openNew} size="sm" className="gap-1.5 text-white" style={{ backgroundColor: "#8b6914" }}>
            <Plus className="w-3.5 h-3.5" /> Add Package
          </Button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="border-b border-stone-100 bg-stone-50 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-800">
              {editingId ? "Edit Package" : "New Package"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Name */}
              <div className="space-y-1.5">
                <Label>Package Name *</Label>
                <Input {...form.register("name")} placeholder="e.g. Morning Slot, Full Day Package" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  defaultValue={form.getValues("type")}
                  onValueChange={(v) => form.setValue("type", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex flex-col">
                          <span>{t.label}</span>
                          <span className="text-xs text-stone-400">{t.hint}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <Label>Price (₹) *</Label>
                <Input type="number" {...form.register("price")} placeholder="0" min={0} />
                {form.formState.errors.price && (
                  <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                )}
              </div>

              {/* Duration hours — only for hourly */}
              {watchedType === "hourly" && (
                <div className="space-y-1.5">
                  <Label>Duration (hours per slot)</Label>
                  <Input type="number" {...form.register("durationHours")} placeholder="1" min={1} />
                  {form.formState.errors.durationHours && (
                    <p className="text-xs text-red-500">{form.formState.errors.durationHours.message}</p>
                  )}
                  <p className="text-xs text-stone-400">How many hours does 1 booking unit cover?</p>
                </div>
              )}

              {/* Start / End time — for half_day and full_day */}
              {(watchedType === "half_day" || watchedType === "full_day") && (
                <>
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input type="time" {...form.register("startTime")} />
                    {form.formState.errors.startTime && (
                      <p className="text-xs text-red-500">{form.formState.errors.startTime.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Time</Label>
                    <Input type="time" {...form.register("endTime")} />
                    {form.formState.errors.endTime && (
                      <p className="text-xs text-red-500">{form.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Display order */}
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" {...form.register("displayOrder")} placeholder="0" min={0} />
                {form.formState.errors.displayOrder && (
                  <p className="text-xs text-red-500">{form.formState.errors.displayOrder.message}</p>
                )}
                <p className="text-xs text-stone-400">Lower = shown first</p>
              </div>

            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea {...form.register("description")} rows={2}
                placeholder="e.g. Includes setup time, available Mon–Sat" />
              {form.formState.errors.description && (
                <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <Switch
                id="pkg-active"
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
              <Label htmlFor="pkg-active" className="cursor-pointer">
                Active — visible to customers
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.formState.isSubmitting}
                className="text-white gap-1.5"
                style={{ backgroundColor: "#8b6914" }}
              >
                {form.formState.isSubmitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                  : <><Check className="w-3.5 h-3.5" />{editingId ? "Save Changes" : "Add Package"}</>
                }
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Package list */}
      {packages.length === 0 && !showForm ? (
        <div className="py-12 text-center text-stone-400">
          <p className="text-sm mb-3">No packages yet — customers won't see pricing</p>
          <Button onClick={openNew} variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add First Package
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors">
              {/* Type badge */}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${TYPE_COLORS[pkg.type] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                {pkg.type.replace("_", " ")}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-900 text-sm truncate">{pkg.name}</p>
                  {!pkg.is_active && (
                    <span className="text-xs bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-stone-400 mt-0.5">
                  {pkg.start_time && pkg.end_time && (
                    <span>{pkg.start_time.slice(0, 5)} – {pkg.end_time.slice(0, 5)}</span>
                  )}
                  {pkg.duration_hours && <span>{pkg.duration_hours}h per slot</span>}
                  {pkg.description && <span className="truncate max-w-xs">{pkg.description}</span>}
                </div>
              </div>

              {/* Price */}
              <p className="font-bold text-stone-900 text-sm flex-shrink-0">
                ₹{Number(pkg.price).toLocaleString("en-IN")}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(pkg)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  disabled={deletingId === pkg.id}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {deletingId === pkg.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
