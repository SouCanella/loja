"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { FieldTipBeside } from "@/components/painel/FieldTip";
import { PainelStickyHeading } from "@/components/painel/PainelStickyHeading";
import { apiPainelJson, PainelApiError } from "@/lib/painel-api";
import {
  painelBtnDangerCompactClass,
  painelBtnLinkCompactClass,
  painelBtnPrimaryClass,
  painelBtnPrimaryCompactClass,
  painelBtnSecondaryCompactClass,
} from "@/lib/painel-button-classes";

type Category = { id: string; name: string; slug: string };

export default function CategoriasPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

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
    if (!n) {
      setMsg("Indique o nome da categoria.");
      return;
    }
    try {
      await apiPainelJson("/api/v2/categories", {
        method: "POST",
        body: JSON.stringify({ name: n }),
      });
      setName("");
      setMsg("Categoria criada.");
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível criar.");
    }
  }

  async function patchName(id: string, newName: string): Promise<boolean> {
    setBusyId(id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      setMsg("Guardado.");
      void load();
      return true;
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Erro ao guardar.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(id: string) {
    const v = editDraft.trim();
    if (!v) {
      setMsg("Indique um nome.");
      return;
    }
    const ok = await patchName(id, v);
    if (ok) {
      setEditingId(null);
      setEditDraft("");
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function remove(id: string) {
    if (!window.confirm("Remover esta categoria? (Só se não estiver em uso por produtos.)")) return;
    setBusyId(id);
    setMsg(null);
    try {
      await apiPainelJson(`/api/v2/categories/${id}`, { method: "DELETE" });
      setMsg("Removida.");
      if (editingId === id) cancelEdit();
      void load();
    } catch (e: unknown) {
      setMsg(e instanceof PainelApiError ? e.message : "Não foi possível remover.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PainelStickyHeading
        title="Categorias"
        description="Categorias planas da loja (filtros e agrupamento na vitrine)."
      />

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
        <div className="mt-3 max-w-md">
          <label className="text-xs font-medium text-slate-600" htmlFor="cn">
            <FieldTipBeside tip="Nome visível para clientes e no painel (ex.: Bolos, Bebidas).">Nome</FieldTipBeside>
          </label>
          <input
            id="cn"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Doces"
          />
        </div>
        <button
          type="submit"
          className={`mt-4 ${painelBtnPrimaryClass}`}
        >
          Criar
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 && !err ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">Nenhuma categoria.</li>
        ) : null}
        {rows.map((c) => {
          const isEditing = editingId === c.id;
          const disabled = busyId === c.id;
          return (
            <li
              key={c.id}
              className="flex flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    autoFocus
                    className="w-full max-w-md rounded border border-slate-300 px-2 py-1.5 font-medium text-slate-900"
                    value={editDraft}
                    disabled={disabled}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEdit(c.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                ) : (
                  <span className="font-medium text-slate-900">{c.name}</span>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void saveEdit(c.id)}
                      className={painelBtnPrimaryCompactClass}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={cancelEdit}
                      className={painelBtnSecondaryCompactClass}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setEditingId(c.id);
                      setEditDraft(c.name);
                    }}
                    className={painelBtnLinkCompactClass}
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void remove(c.id)}
                  className={painelBtnDangerCompactClass}
                >
                  Remover
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
