import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Photo = {
  id: string;
  storage_path: string;
  public_url: string;
  title: string | null;
  alt_text: string;
  category_id: string | null;
  sort_order: number;
  featured: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type SiteContent = {
  key: string;
  value: Record<string, unknown>;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  body: string;
  source: string;
  sort_order: number;
  created_at: string;
};

export type Package = {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
  badge: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export const reviewsQuery = () =>
  queryOptions({
    queryKey: ["reviews"],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from("reviews" as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Review[];
    },
    staleTime: 30_000,
  });

export const packagesQuery = (onlyActive = false) =>
  queryOptions({
    queryKey: ["packages", onlyActive],
    queryFn: async (): Promise<Package[]> => {
      let q = supabase.from("packages" as any).select("*").order("sort_order", { ascending: true });
      if (onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Package[];
    },
    staleTime: 30_000,
  });

export const photosQuery = () =>
  queryOptions({
    queryKey: ["photos"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    staleTime: 30_000,
  });

export const featuredPhotosQuery = () =>
  queryOptions({
    queryKey: ["photos", "featured"],
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("featured", true)
        .order("sort_order", { ascending: true })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
    staleTime: 30_000,
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
  });

export const siteContentQuery = (key: string) =>
  queryOptions({
    queryKey: ["site_content", key],
    queryFn: async (): Promise<SiteContent | null> => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data as SiteContent | null;
    },
    staleTime: 60_000,
  });

export const isAdminQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["is_admin", userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
