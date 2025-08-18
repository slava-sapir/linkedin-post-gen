// src/components/PostComposer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

const LI_MAX = 3000;

export default function PostComposer() {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [post, setPost] = useState("");
  const [copied, setCopied] = useState(false);
  const [liReady, setLiReady] = useState(false);
  const [loading, setLoading] = useState<"gen" | "post" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load any saved draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("draft");
      if (saved) {
        const { title, prompt, post } = JSON.parse(saved);
        if (typeof title === "string") setTitle(title);
        if (typeof prompt === "string") setPrompt(prompt);
        if (typeof post === "string") setPost(post);
      }
    } catch {}
  }, []);

  // Detect LinkedIn auth return (?li=ok) and clean the URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const status = url.searchParams.get("li");
      if (status === "ok") setLiReady(true);
      if (status) {
        url.searchParams.delete("li");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  const count = useMemo(() => post.length, [post]);
  const overLimit = count > LI_MAX;

  function onClear() {
    setTitle("");
    setPrompt("");
    setPost("");
    setError(null);
  }

  function onSaveDraft() {
    localStorage.setItem("draft", JSON.stringify({ title, prompt, post }));
  }

  function onLoadDraft() {
    const saved = localStorage.getItem("draft");
    if (!saved) return;
    try {
      const { title, prompt, post } = JSON.parse(saved);
      setTitle(title || "");
      setPrompt(prompt || "");
      setPost(post || "");
    } catch {}
  }

  function onDeleteDraft() {
    localStorage.removeItem("draft");
  }

  async function onCopy() {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function onGenerate() {
    try {
      setLoading("gen");
      setError(null);
      setPost("Generating…");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (ct.includes("application/json")) {
          const data = await res.json();
          throw new Error(data?.error || `HTTP ${res.status}`);
        } else {
          const text = await res.text(); // HTML error page
          console.error("Server non-JSON:", text.slice(0, 200));
          throw new Error(`Server returned non‑JSON (status ${res.status}).`);
        }
      }

      const data = await res.json();
      setPost(data.post || "");
    } catch (e: any) {
      setPost("");
      setError(e?.message || "Failed to generate");
    } finally {
      setLoading(null);
    }
  }

  function loginLinkedIn() {
    window.location.href = "/api/linkedin/auth";
  }

  async function postToLinkedIn() {
    if (!post) return;
    try {
      setLoading("post");
      setError(null);
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post }),
      });
      const data = await res.json();
      if (!res.ok) {
        // surface LinkedIn’s message if present
        throw new Error(data?.error || data?.message || "LinkedIn post failed");
      }
      alert("Posted to LinkedIn! Check your feed.");
    } catch (e: any) {
      setError(e?.message || "Failed to post to LinkedIn");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Compose</h2>

        <label className="mb-2 block text-sm font-medium text-gray-900">
          Title (optional)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 3 ways AI speeds up web dev"
          className="mb-4 w-full rounded-lg border px-3 py-2 outline-none focus:ring text-gray-800"
        />

        <label className="mb-2 block text-sm font-medium text-gray-900">
          Prompt / Notes
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write 100–200 words sharing 3 actionable tips…"
          rows={6}
          className="mb-4 w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring text-gray-800"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGenerate}
            disabled={loading === "gen"}
            className="rounded-xl bg-black px-4 py-2 text-white enabled:hover:opacity-90 disabled:opacity-40"
          >
            {loading === "gen" ? "Generating…" : "Generate with AI"}
          </button>

          {!liReady ? (
            <button
              onClick={loginLinkedIn}
              className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
              title="Authenticate with LinkedIn to enable posting"
            >
              Login with LinkedIn
            </button>
          ) : (
            <button
              onClick={postToLinkedIn}
              disabled={!post || overLimit || loading === "post"}
              className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800 disabled:opacity-40"
              title="Publish this text to your LinkedIn feed"
            >
              {loading === "post" ? "Posting…" : "Post to LinkedIn"}
            </button>
          )}

          <button
            onClick={onSaveDraft}
            className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
            title="Save to this browser only"
          >
            Save draft
          </button>
          <button
            onClick={onLoadDraft}
            className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
          >
            Load draft
          </button>
          <button
            onClick={onDeleteDraft}
            className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
          >
            Delete draft
          </button>

          <button
            onClick={onCopy}
            disabled={!post}
            className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={onClear}
            className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800"
          >
            Clear
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preview</h2>
          <div className="text-sm">
            <span className={overLimit ? "text-red-600" : "text-gray-500"}>
              {count} / {LI_MAX}
            </span>
          </div>
        </div>

        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          rows={10}
          className={`w-full resize-y rounded-lg border px-3 py-2 outline-none text-gray-800 focus:ring ${
            overLimit ? "border-red-400" : ""
          }`}
          placeholder="Your generated post will appear here… (You can edit freely.)"
        />

        {overLimit && (
          <p className="mt-3 text-sm text-red-600">
            Your post exceeds LinkedIn’s ~3000 character limit. Trim a bit.
          </p>
        )}
      </section>
    </div>
  );
}
