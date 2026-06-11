import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Upload, Trash2, Star, StarOff, Save, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  photosQuery,
  categoriesQuery,
  siteContentQuery,
  isAdminQuery,
  reviewsQuery,
  packagesQuery,
  type Photo,
  type Category,
  type Review,
  type Package,
} from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Admin — Nieve Blyth Photography" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext() as { user: { id: string; email?: string } };
  const { data: isAdmin, isLoading: roleLoading } = useQuery(isAdminQuery(user.id));

  useEffect(() => {
    if (!roleLoading && isAdmin === false) {
      toast.error("You don't have admin access.");
    }
  }, [roleLoading, isAdmin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (roleLoading) {
    return <div className="pt-32 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="pt-32 px-6 max-w-md mx-auto text-center">
        <h1 className="text-2xl text-ink">Not authorized</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This account doesn't have admin access.
        </p>
        <button
          onClick={signOut}
          className="mt-6 border-b border-ink pb-1 text-xs uppercase tracking-[0.28em]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <section className="pt-28 pb-24 px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="eyebrow">Studio</p>
            <h1 className="mt-3 text-3xl text-ink">Admin</h1>
            <p className="mt-1 text-xs text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="text-xs uppercase tracking-[0.22em] hover:opacity-60">
              View site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] hover:opacity-60"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        <Tabs defaultValue="photos">
          <TabsList>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="photos"><PhotosPanel /></TabsContent>
          <TabsContent value="categories"><CategoriesPanel /></TabsContent>
          <TabsContent value="reviews"><ReviewsPanel /></TabsContent>
          <TabsContent value="packages"><PackagesPanel /></TabsContent>
          <TabsContent value="content"><ContentPanel /></TabsContent>
          <TabsContent value="enquiries"><EnquiriesPanel /></TabsContent>
          <TabsContent value="messages"><MessagesPanel /></TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

/* -------- Photos -------- */
function PhotosPanel() {
  const qc = useQueryClient();
  const { data: photos = [] } = useQuery(photosQuery());
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (upErr) throw upErr;
        const { data: signed, error: signErr } = await supabase.storage
          .from("photos")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        const dims = await readImageDims(file).catch(() => ({ width: null, height: null }));
        const { error: insErr } = await supabase.from("photos").insert({
          storage_path: path,
          public_url: signed.signedUrl,
          alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
          width: dims.width,
          height: dims.height,
        });
        if (insErr) throw insErr;
      }
      toast.success(`Uploaded ${files.length} photo${files.length > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["photos"] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const updatePhoto = async (id: string, patch: Partial<Photo>) => {
    const { error } = await supabase.from("photos").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["photos"] });
  };

  const deletePhoto = async (p: Photo) => {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from("photos").remove([p.storage_path]);
    const { error } = await supabase.from("photos").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["photos"] });
    toast.success("Deleted");
  };

  return (
    <div className="mt-8">
      <label className="block border-2 border-dashed border-border p-10 text-center cursor-pointer hover:bg-cream/40 transition-colors">
        <Upload className="mx-auto mb-3" size={20} strokeWidth={1.5} />
        <p className="text-sm">
          {uploading ? "Uploading…" : "Drop photos here or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — large files welcome</p>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((p) => (
          <div key={p.id} className="border border-border p-3 space-y-3">
            <div className="aspect-square bg-stone overflow-hidden">
              <img src={p.public_url} alt={p.alt_text} className="w-full h-full object-cover" />
            </div>
            <input
              defaultValue={p.alt_text}
              onBlur={(e) => e.target.value !== p.alt_text && updatePhoto(p.id, { alt_text: e.target.value })}
              placeholder="Alt text"
              className="w-full text-xs border-b border-border py-1 outline-none focus:border-ink"
            />
            <select
              defaultValue={p.category_id ?? ""}
              onChange={(e) => updatePhoto(p.id, { category_id: e.target.value || null })}
              className="w-full text-xs border border-border py-1 px-2 bg-white"
            >
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                defaultValue={p.sort_order}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  if (v !== p.sort_order) updatePhoto(p.id, { sort_order: v });
                }}
                className="flex-1 text-xs border border-border py-1 px-2"
                title="Sort order"
              />
              <button
                onClick={() => updatePhoto(p.id, { featured: !p.featured })}
                className={`text-xs px-2 ${p.featured ? "text-ink" : "text-muted-foreground"}`}
                title="Featured"
              >
                {p.featured ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
              </button>
              <button onClick={() => deletePhoto(p)} className="text-xs text-destructive px-2">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function readImageDims(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.width, height: img.height }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ width: null, height: null }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

/* -------- Categories -------- */
function CategoriesPanel() {
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery(categoriesQuery());
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    const s = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: s, sort_order: (categories.at(-1)?.sort_order ?? 0) + 10 });
    if (error) return toast.error(error.message);
    setName(""); setSlug("");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
  const del = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="mt-8 max-w-2xl space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="flex-1 border-b border-border py-2 outline-none focus:border-ink" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (auto)" className="flex-1 border-b border-border py-2 outline-none focus:border-ink" />
        <button onClick={add} className="bg-ink text-white px-6 text-xs uppercase tracking-[0.22em]">Add</button>
      </div>
      <ul className="border-t border-border">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm text-ink">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <button onClick={() => del(c)} className="text-destructive"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------- Content -------- */
function ContentPanel() {
  return (
    <div className="mt-8 space-y-12 max-w-2xl">
      <ContentEditor key_="hero" label="Hero" fields={[["title","Title"],["subtitle","Subtitle"],["cta","CTA label"]]} />
      <ContentEditor key_="intro" label="Intro" fields={[["heading","Heading"],["body","Body","textarea"]]} />
      <ContentEditor key_="about" label="About" fields={[["heading","Heading"],["body","Body","textarea"],["portraitUrl","Portrait image URL"]]} />
      <ContentEditor key_="contact" label="Contact / Social" fields={[["email","Email"],["facebookUrl","Facebook URL"],["instagramUrl","Instagram URL"]]} />
    </div>
  );
}

function ContentEditor({
  key_,
  label,
  fields,
}: {
  key_: string;
  label: string;
  fields: Array<[string, string, "textarea"?]>;
}) {
  const qc = useQueryClient();
  const { data } = useQuery(siteContentQuery(key_));
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setValues((data.value as Record<string, string>) ?? {});
  }, [data]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert({ key: key_, value: values });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${label} saved`);
    qc.invalidateQueries({ queryKey: ["site_content", key_] });
  };

  return (
    <div className="border border-border p-6">
      <p className="eyebrow">{label}</p>
      <div className="mt-4 space-y-4">
        {fields.map(([k, lbl, type]) => (
          <label key={k} className="block">
            <span className="text-xs text-muted-foreground">{lbl}</span>
            {type === "textarea" ? (
              <textarea
                value={values[k] ?? ""}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                rows={4}
                className="mt-1 w-full border border-border p-2 text-sm outline-none focus:border-ink resize-none"
              />
            ) : (
              <input
                value={values[k] ?? ""}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                className="mt-1 w-full border-b border-border py-1 outline-none focus:border-ink text-sm"
              />
            )}
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 bg-ink text-white px-5 py-2 text-xs uppercase tracking-[0.22em]">
        <Save size={12} /> {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

/* -------- Enquiries / Messages -------- */
function EnquiriesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["booking_enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="mt-8 text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="mt-8 text-sm text-muted-foreground">No enquiries yet.</p>;
  return (
    <ul className="mt-8 space-y-4">
      {data.map((e: any) => (
        <li key={e.id} className="border border-border p-5">
          <div className="flex justify-between flex-wrap gap-2">
            <p className="font-medium text-ink">{e.name}</p>
            <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
          </div>
          <p className="text-sm mt-1"><a href={`mailto:${e.email}`} className="hover:opacity-60">{e.email}</a>{e.phone && ` · ${e.phone}`}</p>
          <div className="mt-3 text-xs text-muted-foreground space-x-3">
            {e.event_type && <span>Type: <span className="text-ink">{e.event_type}</span></span>}
            {e.preferred_date && <span>Date: <span className="text-ink">{e.preferred_date}</span></span>}
          </div>
          {e.message && <p className="mt-3 text-sm whitespace-pre-wrap">{e.message}</p>}
        </li>
      ))}
    </ul>
  );
}

function MessagesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="mt-8 text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="mt-8 text-sm text-muted-foreground">No messages yet.</p>;
  return (
    <ul className="mt-8 space-y-4">
      {data.map((m: any) => (
        <li key={m.id} className="border border-border p-5">
          <div className="flex justify-between flex-wrap gap-2">
            <p className="font-medium text-ink">{m.name}</p>
            <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
          </div>
          <p className="text-sm mt-1"><a href={`mailto:${m.email}`} className="hover:opacity-60">{m.email}</a></p>
          <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
