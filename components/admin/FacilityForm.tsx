"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFacility, updateFacility } from "@/actions/facilities";

// Match EXACTLY what createFacility / the facilities table accepts
const facilitySchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
  category: z.string().min(1, "Category is required"),
  short_description: z.string().max(180).optional(),
  description: z.string().min(10, "Description is required").max(3000),
  rules: z.string().max(2000).optional(),
  min_capacity: z.coerce.number().int().min(1).optional(),
  max_capacity: z.coerce.number().int().min(1).optional(),
  inventory_count: z.coerce.number().int().min(1).default(1),
  status: z.enum(["active", "inactive", "maintenance"]),
  display_order: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof facilitySchema>;

interface Props {
  facility?: any;
  isEdit?: boolean;
}

const CATEGORIES = [
  { value: "general",       label: "General" },
  { value: "event",         label: "Banquet / Events" },
  { value: "sports",        label: "Sports" },
  { value: "recreation",    label: "Recreation / Pool" },
  { value: "accommodation", label: "Accommodation" },
  { value: "outdoor",       label: "Outdoor" },
  { value: "fitness",       label: "Gym / Fitness" },
  { value: "other",         label: "Other" },
];

export function FacilityForm({ facility, isEdit = false }: Props) {
  const router = useRouter();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(facility?.thumbnail_url ?? "");
  const [thumbnailPublicId, setThumbnailPublicId] = useState<string>("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [features, setFeatures] = useState<string[]>(facility?.features ?? []);
  const [featureInput, setFeatureInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(facilitySchema) as any,
    defaultValues: {
      name:              facility?.name ?? "",
      slug:              facility?.slug ?? "",
      category:          facility?.category ?? "general",
      short_description: facility?.short_description ?? "",
      description:       facility?.description ?? "",
      rules:             facility?.rules ?? "",
      min_capacity:      facility?.min_capacity ?? undefined,
      max_capacity:      facility?.max_capacity ?? undefined,
      inventory_count:   facility?.inventory_count ?? 1,
      status:            facility?.status ?? "active",
      display_order:     facility?.display_order ?? 0,
    },
  });

  const watchedCategory = watch("category");

  const handleThumbnailUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB");
      return;
    }
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "facilities/thumbnails");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.url) throw new Error("Upload failed");
      setThumbnailUrl(data.url);
      setThumbnailPublicId(data.publicId ?? "");
      toast.success("Image uploaded");
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

  const onSubmit = async (values: FormValues) => {
    try {
      // Map form values → FacilitySchema shape expected by server action
      const payload: any = {
        name:             values.name,
        slug:             values.slug,
        category:         values.category,
        shortDescription: values.short_description ?? null,
        description:      values.description,
        rules:            values.rules ?? null,
        minCapacity:      values.min_capacity ?? 1,
        maxCapacity:      values.max_capacity ?? null,
        inventoryCount:   values.inventory_count ?? 1,
        status:           values.status,
        displayOrder:     values.display_order,
        thumbnailUrl:     thumbnailUrl || undefined,
      };

      const result = isEdit && facility
        ? await updateFacility(facility.id, payload)
        : await createFacility(payload);

      if (!result.success) {
        toast.error(result.error ?? "Failed to save facility");
        return;
      }

      toast.success(isEdit ? "Facility updated!" : "Facility created!");
      router.push("/dashboard/facilities");
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">

      {/* Thumbnail */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Thumbnail Image</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center">
            {thumbnailUrl
              ? <>
                  <Image src={thumbnailUrl} alt="Thumbnail" fill sizes="160px" className="object-cover" />
                  <button type="button" onClick={() => { setThumbnailUrl(""); setThumbnailPublicId(""); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </>
              : <Upload className="w-6 h-6 text-stone-300" />}
          </div>
          <div>
            <Label htmlFor="thumb-upload" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingThumb ? "Uploading…" : "Upload Image"}
              </div>
            </Label>
            <input id="thumb-upload" type="file" accept="image/*,.heic,.HEIC,.heif,.HEIF" className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
            <p className="text-xs text-stone-400 mt-2">Recommended: 800×600px, JPG/PNG, max 10 MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="space-y-1.5">
            <Label htmlFor="name">Facility Name *</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Banquet Hall" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" {...register("slug")} placeholder="e.g. banquet-hall" />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select defaultValue={getValues("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select defaultValue={getValues("status")} onValueChange={(v) => setValue("status", v as any)}>
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
            <Input id="short_description" {...register("short_description")}
              placeholder="One-line tagline shown on the facility card" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Full Description *</Label>
            <Textarea id="description" {...register("description")} rows={5}
              placeholder="Detailed description of the facility…" />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rules">Rules / Instructions</Label>
            <Textarea id="rules" {...register("rules")} rows={3}
              placeholder="Any booking rules, dos and don'ts…" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="min_capacity">Min Capacity (persons)</Label>
            <Input id="min_capacity" type="number" {...register("min_capacity")} placeholder="1" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max_capacity">Max Capacity (persons)</Label>
            <Input id="max_capacity" type="number" {...register("max_capacity")} placeholder="500" />
          </div>

          {/* Inventory count — accommodation only */}
          {watchedCategory === "accommodation" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="inventory_count">Number of Rooms Available *</Label>
              <Input id="inventory_count" type="number" min={1} {...register("inventory_count")} placeholder="e.g. 5" />
              <p className="text-xs text-stone-400">Total rooms that can be booked simultaneously on any given date</p>
              {errors.inventory_count && <p className="text-xs text-red-500">{errors.inventory_count.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="display_order">Display Order</Label>
            <Input id="display_order" type="number" {...register("display_order")} placeholder="0" />
            <p className="text-xs text-stone-400">Lower numbers appear first</p>
          </div>

        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h2 className="font-medium text-stone-900 mb-4">Amenities / Features</h2>
        <div className="flex gap-2 mb-3">
          <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
            placeholder="e.g. Air Conditioning" />
          <Button type="button" variant="outline" onClick={addFeature} className="gap-1 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {features.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 text-sm px-2.5 py-1 rounded-full">
              {f}
              <button type="button" onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                className="text-stone-400 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {features.length === 0 && <p className="text-stone-400 text-sm">No amenities added yet</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-8">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}
          className="min-w-32 text-white"
          style={{ backgroundColor: "#08428C" }}>
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</>
            : isEdit ? "Save Changes" : "Create Facility"}
        </Button>
      </div>
    </form>
  );
}
