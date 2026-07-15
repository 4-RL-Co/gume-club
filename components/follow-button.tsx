"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/[handle]/actions";

/**
 * Follow. Unilateral, no request, no approval: a public shelf does not ask
 * permission to be read.
 *
 * There is no follower count here, and there never will be. A number next to a
 * person turns reading into standing, and standing is what the README refuses.
 */
export function FollowButton({
  userId, handle, following,
}: {
  userId: string;
  handle: string;
  following: boolean;
}) {
  const [on, setOn] = useState(following);
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleFollow(userId, handle, on);
          setOn(!on);
        })
      }
      className={[
        "rounded-[var(--radius-control)] border px-4 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40",
        on
          ? "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
          : "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-canvas)]",
      ].join(" ")}
    >
      {pending ? "…" : on ? "seguindo" : "seguir"}
    </button>
  );
}
