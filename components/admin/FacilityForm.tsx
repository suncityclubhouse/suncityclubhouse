"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFacility, updateFacility } from "@/actions/facilities";
import type { Facility } from "@/types/database";

const facilitySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
  category: z.enum(["banquet", "sports", "meeting_room", "pool", "gym", "outdoor", "other"]),
  short_description: z.string().max(180).optional(),
  description: z.string().min(10).max(3000),
  capacity: z.coerce.number().int().min(1).optional(),
  area_sqft: z.coerce.number().int().min(1).optional(),
  location_hint: z.string().max(200).optional(),
  status: z.enum(["active", "inactive", "maintenance"]),
  resident_half_day_price: z.coerce.number().min(0).optional(),
  resident_full_day_price: z.coerce.number().min(0).optional(),
  outsider_half_day_price: z.coerce.number().min(0).optional(),
  outsider_full_day_price: z.coerce.number().min(0).optional(),
  custom_slot_price_per_hour: z.coerce.number().min(0).optional(),
  deposit_amount: z.coerce.number().min(0).optional(),
  allows_half_day: z.boolean().default(true),
  allows_full_day: z.boolean().default(true),
  allows_custom_slot: z.boolean().default(false),
  advance_booking_days: z.coerce.number().int().min(1).default(180),
  min_hours_before_booking: z.coerce.number().int().min(0).default(24),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

interface FacilityFormProps {
  facility?: Facility;
  isEdit?: boolean;
}

const CATEGORIES = [
  { value: "banquet", label: "Banquet Hall" },
  { value: "sports", label: "Sports" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "pool", label: "Swimming Pool" },
  { value: "gym", label: "Gym/Fitness" },
  { value: "outdoor", label: "Outdoor Space" },
  { value: "other", label: "Other" },
];

export function FacilityForm({ facility, isEdit = false }: FacilityFormProps) {
  const router = useRouter();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(facility?.thumbnail_url ?? "");
  const [thumbnailPublicId, setThumbnailPublicId] = useState<string>("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [features, setFeatures] = useState<string[]>(
    (facility as any)?.features ?? []
  );
  const [featureInput, setFeatureInput] = useState("");

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema) as any,
    defaultValues: {
      name: facility?.name ?? "",
      slug: facility?.slug ?? "",
      category: (facility?.category as any) ?? "banquet",
      short_description: facility?.short_description ?? "",
      description: facility?.description ?? "",
      capacity: (facility as any)?.capacity ?? undefined,
      area_sqft: (facility as any)?.area_sqft ?? undefined,
      location_hint: (facility as any)?.location_hint ?? "",
      status: facility?.status ?? "active",
      resident_half_day_price: (facility as any)?.resident_half_day_price ?? undefined,
      resident_full_day_price: (facility as any)?.resident_full_day_price ?? undefined,
      outsider_half_day_price: (facility as any)?.outsider_half_day_price ?? undefined,
      outsider_full_day_price: (facility as any)?.outsider_full_day_price ?? undefined,
      custom_slot_price_per_hour: (facility as any)?.custom_slot_price_per_hour ?? undefined,
      deposit_amount: (facility as any)?.deposit_amount ?? undefined,
      allows_half_day: (facility as any)?.allows_half_day ?? true,
      allows_full_day: (facility as any)?.allows_full_day ?? true,
      allows_custom_slot: (facility as any)?.allows_custom_slot ?? false,
      advance_booking_days: (facility as any)?.advance_booking_days ?? 180,
      min_hours_before_booking: (facility as any)?.min_hours_before_booking ?? 24,
    },
  });

  // Upload thumbnail to Cloudinary via server endpoint
  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "facilities/thumbnails");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.url) throw new Error("Upload failed");
      setThumbnailUrl(data.url);
      setThumbnailPublicId(data.publicId);
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploadingThumb(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && features.length < 20) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const removeFeature = (i: number) => setFeatures(features.filter((_, idx) => idx !== i));

  const onSubmit = async (values: FacilityFormValues) => {
    try {
      const payload = {
        ...values,
        thumbnail_url: thumbnailUrl || undefined,
        thumbnail_public_id: thumbnailPublicId || undefined,
        features,
      };

      const res = isEdit && facility
        ? await updateFacility(facility.id, payload as any)
        : await createFacility(payload as any);

      if (!res.success) {
        toast.error(res.error ?? "Failed to save facility");
        return;
      }

      toast.success(isEdit ? "Facility updated" : "Facility created");
      router.push("/dashboard/facilities");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Thumbnail */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Thumbnail Image</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative w-40 h-32 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0">
            {thumbnailUrl ? (
              <>
                <Image src={thumbnailUrl} alt="Thumbnail" fill sizes="160px" className="object-cover" />
                <button type="button" onClick={() => { setThumbnailUrl(""); setThumbnailPublicId(""); }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <Upload className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="thumbnail-upload" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingThumb ? "Uploading…" : "Upload Image"}
              </div>
            </Label>
            <input id="thumbnail-upload" type="file" accept="image/*" className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
            <p className="text-xs text-stone-400 mt-2">Recommended: 800×600px, JPG or PNG, max 5MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Facility Name *</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. Grand Banquet Hall" />
            {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" {...form.register("slug")} placeholder="e.g. grand-banquet-hall" />
            {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select defaultValue={form.getValues("category")} onValueChange={(v) => form.setValue("category", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select defaultValue={form.getValues("status")} onValueChange={(v) => form.setValue("status", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input id="short_description" {...form.register("short_description")} placeholder="One-line tagline (shown on facility cards)" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Full Description *</Label>
            <Textarea id="description" {...form.register("description")} rows={5} placeholder="Detailed facility description…" />
            {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity (persons)</Label>
            <Input id="capacity" type="number" {...form.register("capacity")} placeholder="200" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area_sqft">Area (sq ft)</Label>
            <Input id="area_sqft" type="number" {...form.register("area_sqft")} placeholder="5000" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="location_hint">Location Hint</Label>
            <Input id="location_hint" {...form.register("location_hint")} placeholder="e.g. Ground floor, Block A" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Pricing (₹)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "resident_half_day_price", label: "Resident — Half Day" },
            { key: "resident_full_day_price", label: "Resident — Full Day" },
            { key: "outsider_half_day_price", label: "Outsider — Half Day" },
            { key: "outsider_full_day_price", label: "Outsider — Full Day" },
            { key: "custom_slot_price_per_hour", label: "Custom Slot (per hour)" },
            { key: "deposit_amount", label: "Security Deposit" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} type="number" {...form.register(key as any)} placeholder="0" />
            </div>
          ))}
        </div>

        {/* Slot types */}
        <div className="mt-4 flex flex-wrap gap-4">
          {[
            { key: "allows_half_day", label: "Allow Half Day" },
            { key: "allows_full_day", label: "Allow Full Day" },
            { key: "allows_custom_slot", label: "Allow Custom Slots" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...form.register(key as any)} className="rounded border-stone-300" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Booking Rules */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Booking Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="advance_booking_days">Max Advance Booking (days)</Label>
            <Input id="advance_booking_days" type="number" {...form.register("advance_booking_days")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min_hours_before_booking">Min Hours Before Booking</Label>
            <Input id="min_hours_before_booking" type="number" {...form.register("min_hours_before_booking")} />
          </div>
        </div>
      </div>

      {/* Amenities/Features */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Amenities / Features</h2>
        <div className="flex gap-2 mb-3">
          <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
            placeholder="e.g. Air Conditioning" />
          <Button type="button" variant="outline" onClick={addFeature} className="gap-1">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {features.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 text-sm px-2.5 py-1 rounded-full">
              {f}
              <button type="button" onClick={() => removeFeature(i)} className="text-stone-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {features.length === 0 && <p className="text-stone-400 text-sm">No amenities added yet</p>}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={form.formState.isSubmitting}
          style={{ backgroundColor: "#8b6914" }} className="text-white min-w-32">
          {form.formState.isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</>
            : isEdit ? "Save Changes" : "Create Facility"}
        </Button>
      </div>
    </form>
  );
}
