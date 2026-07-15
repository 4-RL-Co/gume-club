"use client";

import { useState, useTransition } from "react";
import { AvatarPicker } from "@/components/avatar-picker";
import { Campo } from "@/components/campo";
import { LIMITS } from "@/lib/limits";
import { saveProfile } from "@/app/perfil/actions";

/** Your face, your name, your @, and a short line about you. Nothing else. */
export function ProfileForm({
  displayName, handle, bio, image,
}: {
  displayName: string;
  handle: string;
  bio: string;
  image: string | null;
}) {
  const [foto, setFoto] = useState<string | null>(image);
  const [linha, setLinha] = useState(bio);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 flex flex-col gap-6"
      action={(data: FormData) =>
        start(async () => {
          setError(null);
          setMsg(null);
          const res = await saveProfile({
            displayName: String(data.get("nome") ?? ""),
            handle: String(data.get("handle") ?? ""),
            bio: String(data.get("bio") ?? ""),
            image: foto,
          });
          if (res.ok) setMsg("guardado");
          else setError(res.error);
        })
      }
    >
      <AvatarPicker value={foto} onChange={setFoto} />

      <div className="grid max-w-lg gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>nome</Label>
          {/* Os tetos vêm do LIMITS, e não de um número digitado aqui: um 60 escrito à
              mão na tela e um 60 escrito à mão no servidor são dois números que um dia
              vão discordar, e no dia em que discordarem o texto some sem avisar. */}
          <Input name="nome" defaultValue={displayName} maxLength={LIMITS.displayName} />
        </label>
        <label className="block">
          <Label>seu @</Label>
          <Input name="handle" defaultValue={handle} maxLength={LIMITS.handle} />
        </label>
      </div>

      <label className="block max-w-lg">
        <Label>uma linha sobre você</Label>
        <div className="mt-1.5">
          <Campo
            nome="bio"
            valor={linha}
            aoMudar={setLinha}
            teto={LIMITS.bio}
            linhas={3}
            placeholder="leio devagar e releio muito"
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] leading-relaxed outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
        </div>
      </label>

      {error && <p className="text-[13px] text-[var(--color-perigo)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Guardando" : "Guardar"}
        </button>
        {msg && !pending && <span className="text-[12px] text-[var(--color-ink-faint)]">{msg}</span>}
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-1.5 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
    />
  );
}
