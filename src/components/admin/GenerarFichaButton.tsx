"use client";

import { useState, useTransition } from "react";
import { generarFichaOportunidadAction } from "@/lib/actions/fichaOportunidad";

interface GenerarFichaButtonProps {
  conversacionId: string;
  yaExiste: boolean;
}

export function GenerarFichaButton({
  conversacionId,
  yaExiste,
}: GenerarFichaButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const resultado = await generarFichaOportunidadAction(conversacionId);
      if (!resultado.ok) {
        setError(resultado.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-50"
      >
        {isPending
          ? "Generando..."
          : yaExiste
            ? "Regenerar ficha"
            : "Generar ficha"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
