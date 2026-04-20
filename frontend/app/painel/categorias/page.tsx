"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { FieldTip } from "@/components/painel/FieldTip";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";

type Category = { id: string; name: string; slug: string };

export default function CategoriasPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setErr(null);
    void apiPainelJson<Category[]>("/api/v2/categories")
      .then(setRows)
      .catch((e: unknown) => {
        setErr(e instanceof PainelApiError ? e.message : "Erro ao carregar categorias.");
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const n = name.trim();
    const s = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!n || !s) {
      setMsg("Nome e slug são obrigatórios.");
      return;
    }
    try {
      await apiPainelJson("/api/v2/categories", {
        method: "POST",
        body: JSON.stringify({ name: n, slug: s }),
      });
      setName("");
      setSlug("");
      setMsg("Categoria criada.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível criar.");
    }
  }

  async function patchRow(id: string, body: { name?: string; slug?: string }) {
    setBusyId(id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMsg("Guardado.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remover esta categoria? (Só se não estiver em uso por produtos.)")) return;
    setBusyId(id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/categories/${id}`, { method: "DELETE" });
      setMsg("Removida.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível remover.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">Categorias</h1>
      <p className="mt-1 text-sm text-slate-500">
        Categorias planas da loja (filtros e agrupamento na vitrine).
      </p>

      {err ? <p className="mt-4 text-sm text-amber-800">{err}</p> : null}
      {msg ? (
        <p
          className={`mt-4 text-sm ${msg.includes("Erro") || msg.includes("Não") || msg.includes("não") ? "text-red-700" : "text-emerald-800"}`}
        >
          {msg}
        </p>
      ) : null}

      <form
        onSubmit={(e) => void onCreate(e)}
        className="mt-6 max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-800">Nova categoria</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="min-w-[8rem] flex-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="cn">
              Nome
              <FieldTip text="Nome visível para clientes e no painel (ex.: Bolos, Bebidas)." />
            </label>
            <input
              id="cn"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Doces"
            />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label className="text-xs font-medium text-slate-600" htmlFor="cs">
              Slug (URL)
              <FieldTip text="Identificador curto na URL, sem espaços (ex.: doces). Usado em filtros da vitrine." />
            </label>
            <input
              id="cs"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="doces"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Criar
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 && !err ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma categoria.</li>
        ) : null}
        {rows.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <input
                defaultValue={c.name}
                disabled={busyId === c.id}
                className="min-w-[6rem] flex-1 rounded border border-slate-200 px-2 py-1 font-medium text-slate-900"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.name) void patchRow(c.id, { name: v });
                }}
              />
              <input
                defaultValue={c.slug}
                disabled={busyId === c.id}
                className="w-40 rounded border border-slate-200 px-2 py-1 font-mono text-xs text-slate-600"
                onBlur={(e) => {
                  const v = e.target.value.trim().toLowerCase().replace(/\s+/g, "-");
                  if (v && v !== c.slug) void patchRow(c.id, { slug: v });
                }}
              />
            </div>
            <button
              type="button"
              disabled={busyId === c.id}
              onClick={() => void remove(c.id)}
              className="shrink-0 text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
