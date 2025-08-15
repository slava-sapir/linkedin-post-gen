// src/app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Privacy Policy</h1>
      <p>
        This demo stores drafts only in your browser’s localStorage. No data is sent to a server
        yet. When we add backend features, we will update this page to explain what is collected
        and why.
      </p>
      <h2>What we store now</h2>
      <ul>
        <li>Draft Title, Prompt, and Post (in your local browser only).</li>
      </ul>
      <h2>Contact</h2>
      <p>Email: you@example.com</p>
    </article>
  );
}
