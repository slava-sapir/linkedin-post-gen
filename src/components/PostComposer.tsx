// src/components/PostComposer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

const LI_MAX = 3000;

function mockGeneratePost(title: string, prompt: string) {
  if (!title && !prompt) return "";
  const opening = title
    ? `🔹 ${title}\n\n`
    : "";
  const body = prompt
    ? `${prompt.trim()}\n\n`
    : "";
  const closer =
    "—\nIf this resonates, let’s connect and keep the conversation going.";
  return `${opening}${body}${closer}`.trim();
}

export default function PostComposer() {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [post, setPost] = useState("");
  const [copied, setCopied] = useState(false);

  // Load any saved draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("draft");
    if (saved) {
      try {
        const { title, prompt, post } = JSON.parse(saved);
        setTitle(title || "");
        setPrompt(prompt || "");
        setPost(post || "");
      } catch {}
    }
  }, []);

  // Character count
  const count = useMemo(() => post.length, [post]);
  const overLimit = count > LI_MAX;

  function onGenerateMock() {
    setPost(mockGeneratePost(title, prompt));
  }

  function onClear() {
    setTitle("");
    setPrompt("");
    setPost("");
  }

  async function onCopy() {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Compose</h2>

        <label className="mb-2 block text-sm font-medium">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., 3 ways AI speeds up web development"
          className="mb-4 w-full rounded-lg border px-3 py-2 outline-none focus:ring"
        />

        <label className="mb-2 block text-sm font-medium">Prompt / Notes</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write 100–200 words sharing 3 actionable tips…"
          rows={6}
          className="mb-4 w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGenerateMock}
            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Generate (mock)
          </button>
          <button
            onClick={onClear}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={onSaveDraft}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            title="Save to this browser only"
          >
            Save draft
          </button>
          <button
            onClick={onLoadDraft}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Load draft
          </button>
          <button
            onClick={onDeleteDraft}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Delete draft
          </button>
        </div>
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
          className={`w-full resize-y rounded-lg border px-3 py-2 outline-none focus:ring ${
            overLimit ? "border-red-400" : ""
          }`}
          placeholder="Your generated post will appear here… (You can edit freely.)"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={onCopy}
            disabled={!post}
            className="rounded-xl bg-black px-4 py-2 text-white enabled:hover:opacity-90 disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy"}
          </button>

          {/* Placeholder for future: this will call our API route */}
          <button
            disabled
            title="Will post to LinkedIn once backend is added"
            className="rounded-xl border px-4 py-2 opacity-50"
          >
            Post to LinkedIn (coming soon)
          </button>
        </div>

        {overLimit && (
          <p className="mt-3 text-sm text-red-600">
            Your post exceeds LinkedIn’s ~3000 character limit. Trim a bit.
          </p>
        )}
      </section>
    </div>
  );
}
