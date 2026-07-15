"use client";

import { useState } from "react";

/**
 * Your invite link. Everyone has one, it never runs out, and there is no waiting
 * list. Scarcity of invitations is marketing pretending to be exclusivity.
 *
 * There is no counter here, and there will not be one: "you have invited 3 people"
 * turns bringing a friend into a task with a score attached. See ai/DECISIONS.md.
 */
export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <code className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)]">
        {url}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
        className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)]"
      >
        {copied ? "copiado" : "copiar"}
      </button>
    </div>
  );
}
