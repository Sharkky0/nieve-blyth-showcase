import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Upload, Trash2, Star, StarOff, Save, Plus, ArrowUp, ArrowDown } from "lucide-react";
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
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="photos"><PhotosPanel /></TabsContent>
          <TabsContent value="categories"><CategoriesPanel /></TabsContent>
          <TabsContent value="reviews"><ReviewsPanel /></TabsContent>
          <TabsContent value="packages"><PackagesPanel /></TabsContent>
          <TabsContent value="content"><ContentPanel /></TabsContent>
          <TabsContent value="enquiries"><EnquiriesPanel /></TabsContent>
          <TabsContent value="messages"><MessagesPanel /></TabsContent>
          <TabsContent value="security"><SecurityPanel /></TabsContent>
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
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm text-ink">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <div className="flex items-center gap-1">
              <ReorderButtons
                table="categories"
                items={categories}
                index={i}
                queryKey={["categories"]}
              />
              <button onClick={() => del(c)} className="text-destructive ml-2"><Trash2 size={14} /></button>
            </div>
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

/* -------- Reviews -------- */
function ReviewsPanel() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery(reviewsQuery());
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);

  const add = async () => {
    if (!author.trim() || !body.trim()) return toast.error("Author and review required");
    const { error } = await supabase.from("reviews" as any).insert({
      author: author.trim(),
      body: body.trim(),
      rating,
      sort_order: (reviews.at(-1)?.sort_order ?? 0) + 10,
    });
    if (error) return toast.error(error.message);
    setAuthor(""); setBody(""); setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success("Review added");
  };

  const del = async (r: Review) => {
    if (!confirm(`Delete review from ${r.author}?`)) return;
    const { error } = await supabase.from("reviews" as any).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success("Deleted");
  };

  const update = async (id: string, patch: Partial<Review>) => {
    const { error } = await supabase.from("reviews" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };

  return (
    <div className="mt-8 max-w-3xl">
      <div className="border border-border p-6 space-y-4">
        <p className="eyebrow">Add a Facebook review</p>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Reviewer name" className="w-full border-b border-border py-2 outline-none focus:border-ink text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Review text" rows={4} className="w-full border border-border p-2 outline-none focus:border-ink text-sm resize-none" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Rating:</span>
          <select value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))} className="border border-border px-2 py-1 text-sm">
            {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
          </select>
          <button onClick={add} className="ml-auto inline-flex items-center gap-2 bg-ink text-white px-5 py-2 text-xs uppercase tracking-[0.22em]">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      <ul className="mt-8 space-y-3">
        {reviews.map((r, i) => (
          <li key={r.id} className="border border-border p-5">
            <div className="flex justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-ink">{r.author}</p>
                  <select defaultValue={r.rating} onChange={(e) => update(r.id, { rating: parseInt(e.target.value, 10) })} className="text-xs border border-border px-1 py-0.5">
                    {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-ink/85">"{r.body}"</p>
              </div>
              <div className="flex items-start gap-1">
                <ReorderButtons table="reviews" items={reviews} index={i} queryKey={["reviews"]} />
                <button onClick={() => del(r)} className="text-destructive ml-2"><Trash2 size={14} /></button>
              </div>
            </div>
          </li>
        ))}
        {reviews.length === 0 && <li className="text-sm text-muted-foreground">No reviews yet.</li>}
      </ul>
    </div>
  );
}

/* -------- Packages -------- */
function PackagesPanel() {
  const qc = useQueryClient();
  const { data: packages = [] } = useQuery(packagesQuery(false));

  const add = async () => {
    const { error } = await supabase.from("packages" as any).insert({
      title: "New package",
      description: "",
      price: "",
      features: [],
      sort_order: (packages.at(-1)?.sort_order ?? 0) + 10,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  };

  const update = async (id: string, patch: Partial<Package>) => {
    const { error } = await supabase.from("packages" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
  };

  const del = async (p: Package) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("packages" as any).delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["packages"] });
    toast.success("Deleted");
  };

  return (
    <div className="mt-8 max-w-3xl">
      <button onClick={add} className="inline-flex items-center gap-2 bg-ink text-white px-5 py-2 text-xs uppercase tracking-[0.22em]">
        <Plus size={12} /> New package
      </button>

      <div className="mt-6 space-y-5">
        {packages.map((p, i) => (
          <div key={p.id}>
            <div className="flex items-center justify-end gap-1 mb-1">
              <ReorderButtons table="packages" items={packages} index={i} queryKey={["packages"]} />
            </div>
            <PackageRow pkg={p} onUpdate={(patch) => update(p.id, patch)} onDelete={() => del(p)} />
          </div>
        ))}
        {packages.length === 0 && <p className="text-sm text-muted-foreground">No packages yet — add one to display on the booking page.</p>}
      </div>
    </div>
  );
}

function PackageRow({
  pkg,
  onUpdate,
  onDelete,
}: {
  pkg: Package;
  onUpdate: (patch: Partial<Package>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(pkg.title);
  const [description, setDescription] = useState(pkg.description);
  const [price, setPrice] = useState(pkg.price);
  const [badge, setBadge] = useState(pkg.badge ?? "");
  const [features, setFeatures] = useState((pkg.features ?? []).join("\n"));
  const [sortOrder, setSortOrder] = useState(pkg.sort_order);
  const [active, setActive] = useState(pkg.active);

  const save = () => {
    onUpdate({
      title,
      description,
      price,
      badge: badge.trim() || null,
      features: features.split("\n").map((f) => f.trim()).filter(Boolean),
      sort_order: sortOrder,
      active,
    });
    toast.success("Saved");
  };

  return (
    <div className="border border-border p-5 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border-b border-border py-1 outline-none focus:border-ink text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Price (e.g. £250)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full border-b border-border py-1 outline-none focus:border-ink text-sm" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-muted-foreground">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full border border-border p-2 outline-none focus:border-ink text-sm resize-none" />
      </label>
      <label className="block">
        <span className="text-xs text-muted-foreground">Features (one per line)</span>
        <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} className="mt-1 w-full border border-border p-2 outline-none focus:border-ink text-sm resize-none" />
      </label>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Badge (optional, e.g. Popular)</span>
          <input value={badge} onChange={(e) => setBadge(e.target.value)} className="mt-1 w-full border-b border-border py-1 outline-none focus:border-ink text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Sort order</span>
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)} className="mt-1 w-full border-b border-border py-1 outline-none focus:border-ink text-sm" />
        </label>
        <label className="flex items-center gap-2 pt-5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="text-xs text-muted-foreground">Visible on site</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={save} className="inline-flex items-center gap-2 bg-ink text-white px-4 py-2 text-xs uppercase tracking-[0.22em]">
          <Save size={12} /> Save
        </button>
        <button onClick={onDelete} className="ml-auto text-destructive inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em]">
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

/* -------- Reorder helper -------- */
function ReorderButtons<T extends { id: string; sort_order: number }>({
  table,
  items,
  index,
  queryKey,
}: {
  table: "categories" | "reviews" | "packages";
  items: T[];
  index: number;
  queryKey: readonly unknown[];
}) {
  const qc = useQueryClient();

  const swap = async (dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[index];
    const b = items[j];
    const aOrder = a.sort_order;
    const bOrder = b.sort_order;
    // If equal, nudge so swap is visible
    const newA = bOrder === aOrder ? aOrder + dir : bOrder;
    const newB = bOrder === aOrder ? aOrder : aOrder;
    const [r1, r2] = await Promise.all([
      supabase.from(table as any).update({ sort_order: newA }).eq("id", a.id),
      supabase.from(table as any).update({ sort_order: newB }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) {
      toast.error(r1.error?.message ?? r2.error?.message ?? "Reorder failed");
      return;
    }
    qc.invalidateQueries({ queryKey });
  };

  return (
    <>
      <button
        onClick={() => swap(-1)}
        disabled={index === 0}
        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move up"
        aria-label="Move up"
      >
        <ArrowUp size={14} />
      </button>
      <button
        onClick={() => swap(1)}
        disabled={index === items.length - 1}
        className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move down"
        aria-label="Move down"
      >
        <ArrowDown size={14} />
      </button>
    </>
  );
}

/* -------- Security events -------- */
function SecurityPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("");
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["security_events", filter],
    queryFn: async () => {
      let q = supabase
        .from("security_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter) q = q.eq("event_type", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

  const clearOlderThan = async (days: number) => {
    if (!confirm(`Delete security events older than ${days} day${days === 1 ? "" : "s"}?`)) return;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("security_events" as any)
      .delete()
      .lt("created_at", cutoff);
    if (error) return toast.error(error.message);
    toast.success("Cleared");
    qc.invalidateQueries({ queryKey: ["security_events"] });
  };

  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)));

  const sevColor = (s: string) =>
    s === "error" ? "text-destructive" : s === "warning" ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-border py-1.5 px-2 bg-white"
          >
            <option value="">All event types</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["security_events"] })}
            className="text-xs uppercase tracking-[0.22em] border border-border px-3 py-1.5 hover:bg-cream/40"
          >
            Refresh
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => clearOlderThan(30)}
            className="text-xs uppercase tracking-[0.22em] border border-border px-3 py-1.5 hover:bg-cream/40"
          >
            Clear &gt; 30 days
          </button>
          <button
            onClick={() => clearOlderThan(0)}
            className="text-xs uppercase tracking-[0.22em] border border-destructive text-destructive px-3 py-1.5 hover:bg-destructive/5"
          >
            Clear all
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !events.length ? (
        <p className="text-sm text-muted-foreground">No security events recorded yet.</p>
      ) : (
        <ul className="border-t border-border">
          {events.map((e) => (
            <li key={e.id} className="py-3 border-b border-border grid grid-cols-12 gap-3 text-xs">
              <span className="col-span-3 text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </span>
              <span className={`col-span-1 uppercase tracking-wider ${sevColor(e.severity)}`}>
                {e.severity}
              </span>
              <span className="col-span-3 text-ink">{e.event_type}</span>
              <span className="col-span-2 text-muted-foreground truncate" title={e.path ?? ""}>
                {e.path ?? "—"}
              </span>
              <span className="col-span-3 text-muted-foreground truncate" title={JSON.stringify(e.detail)}>
                ip {e.ip_hash?.slice(0, 8) ?? "—"} · {e.detail ? JSON.stringify(e.detail).slice(0, 80) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
