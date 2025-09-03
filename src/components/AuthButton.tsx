"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-gray-800">Loading...</span>;
  }

  if (session) {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border px-3 py-1 bg-black text-white hover:bg-white hover:text-black"
      >
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("linkedin")}
      className="rounded-lg border px-3 py-1 bg-black text-white hover:bg-white hover:text-black"
    >
      Login with LinkedIn
    </button>
  );
}
