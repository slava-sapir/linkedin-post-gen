"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface LinkedInProfileResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
}

interface MeResponse {
  authenticated: boolean;
  profile?: LinkedInProfileResponse;
}

export default function PostComposer() {
  const [post, setPost] = useState("");
  const [authed, setAuthed] = useState(false);
  const [profile, setProfile] = useState<LinkedInProfileResponse | null>(null);
  const [loading, setLoading] = useState<
    "idle" | "check" | "post" | "generate"
  >("idle");

  // ✅ Check LinkedIn authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading("check");
      try {
        const res = await fetch("/api/linkedin/me");
        const data: MeResponse = await res.json();
        console.log("LinkedIn auth check:", data);
        setAuthed(data.authenticated);
        setProfile(data.profile ?? null);
      } catch (err) {
        console.error("Error checking LinkedIn auth:", err);
        setAuthed(false);
        setProfile(null);
      } finally {
        setLoading("idle");
      }
    };
    checkAuth();
  }, []);

  const handleLinkedInLogin = () => {
    window.location.href = "/api/auth/signin?callbackUrl=/";
  };

  const postToLinkedIn = async () => {
    setLoading("post");
    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post");
      }
      alert("✅ Posted to LinkedIn!");
      setPost("");
    } catch (err) {
      console.error("Error posting to LinkedIn:", err);
      alert("❌ Failed to post");
    } finally {
      setLoading("idle");
    }
  };

  const generateWithAI = async () => {
    setLoading("generate");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: post || "Write a professional LinkedIn post",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setPost(data.text);
    } catch (err) {
      console.error("Error generating post:", err);
      alert("❌ AI generation failed");
    } finally {
      setLoading("idle");
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={post}
        onChange={(e) => setPost(e.target.value)}
        className="w-full border rounded p-2"
        placeholder="Write something to post on LinkedIn..."
      />

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generateWithAI}
          disabled={loading === "generate"}
          className="rounded-xl border px-4 py-2 text-gray-800 hover:bg-gray-100 disabled:opacity-40"
        >
          {loading === "generate" ? "Generating…" : "✨ Generate with AI"}
        </button>

        {authed ? (
          <>
            <button
              onClick={postToLinkedIn}
              disabled={!post || loading === "post"}
              className="rounded-xl border px-4 py-2 enabled:hover:bg-black hover:text-white text-gray-800 disabled:opacity-40"
            >
              {loading === "post" ? "Posting…" : "Post to LinkedIn"}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-xl border px-4 py-2 text-gray-800 hover:bg-gray-100"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={handleLinkedInLogin}
            disabled={loading === "check"}
            className="rounded-xl border px-4 py-2 text-gray-800 hover:bg-gray-100 disabled:opacity-40"
          >
            {loading === "check" ? "Checking…" : "Login with LinkedIn"}
          </button>
        )}
      </div>

      {profile && (
        <p className="text-sm text-gray-600">
          ✅ Logged in as {profile.localizedFirstName}{" "}
          {profile.localizedLastName}
        </p>
      )}
    </div>
  );
}
