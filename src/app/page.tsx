"use client";

import { useSession, signIn } from "next-auth/react";
import PostComposer from "@/components/PostComposer";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!session) {
    return (
      <div className="grid gap-6">
        <h1 className="text-2xl font-bold">Welcome to LinkedIn Post Generator</h1>
        <p className="text-sm text-gray-600">
          Please log in with LinkedIn to start drafting and publishing posts.
        </p>
        <button
          onClick={() => signIn("linkedin")}
          className="rounded-lg border px-3 py-2 hover:bg-black hover:text-white"
        >
          Login with LinkedIn
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Draft your LinkedIn post</h1>
      <p className="text-sm">
        Use the composer below to draft and publish directly to LinkedIn.
      </p>
      <PostComposer />
    </div>
  );
}
