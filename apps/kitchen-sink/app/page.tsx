import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Agent Ready Kitchen Sink</h1>
      <p>Next.js App Router integration examples.</p>
      <nav>
        <ul>
          <li>
            <Link href="/rsc">RSC manifest page</Link> — server-declared manifests
          </li>
          <li>
            <Link href="/client-actions">Client Action page</Link> —{" "}
            <code>useAgentAction(handle, …)</code>
          </li>
        </ul>
      </nav>
    </main>
  );
}
