import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Nieve Blyth Photography" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-dvh flex items-center justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-2xl text-ink">Nieve Blyth</Link>
          <p className="eyebrow mt-4">{mode === "signin" ? "Studio Admin" : "Create Admin"}</p>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <label className="block">
            <span className="eyebrow">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-transparent border-0 border-b border-border focus:border-ink py-2 outline-none"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-transparent border-0 border-b border-border focus:border-ink py-2 outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-white py-4 text-xs uppercase tracking-[0.28em] hover:bg-ink/85 transition-colors disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              First time?{" "}
              <button onClick={() => setMode("signup")} className="border-b border-ink pb-px hover:opacity-60">
                Create the studio admin account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="border-b border-ink pb-px hover:opacity-60">
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
          The first account created becomes the studio administrator.
        </p>
      </div>
    </section>
  );
}
