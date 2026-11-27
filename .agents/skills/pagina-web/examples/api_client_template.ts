/**
 * Template de cliente de API e hooks SWR para o frontend Next.js.
 * Pode ser adaptado para web/lib/api.ts.
 */

import useSWR from "swr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Hook para buscar dados com SWR e cache inteligente.
 *
 * @example
 * const { data, error, isLoading, mutate } = useDadosRecurso();
 */
export function useDadosRecurso<T>(endpoint: string, options?: { refreshInterval?: number }) {
  return useSWR<T>(endpoint, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: options?.refreshInterval ?? 60000, // 1 minuto padrão
  });
}
