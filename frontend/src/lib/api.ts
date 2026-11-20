export interface ApiErrorBody {
  error: { code: string; message: string; details?: { champ: string; message: string }[] };
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  const doFetch = () => fetch(`/api/v1${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'iml-digital', // protection CSRF
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  try {
    res = await doFetch();
    // En cas d'erreur de proxy Vercel temporaire (502 / 504 réveil Render)
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      await new Promise(r => setTimeout(r, 2000));
      res = await doFetch();
    }
  } catch {
    // Tentative de rattrapage automatique (utile lors du réveil du serveur Render ou instabilité 3G/4G)
    try {
      await new Promise(r => setTimeout(r, 2000));
      res = await doFetch();
    } catch {
      throw new ApiError(0, 'RESEAU', 'Le serveur se réveille ou la connexion a été interrompue. Veuillez patienter 10 secondes et réessayer.');
    }
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    const defaultMsg = res.status === 502 || res.status === 503 || res.status === 504
      ? 'Le serveur sécurisé s’active (réveil Render). Veuillez patienter 10 secondes et renouveler votre demande.'
      : 'Une erreur est survenue';
    throw new ApiError(res.status, err?.code ?? 'ERREUR', err?.message ?? defaultMsg);
  }
  return data as T;
}

api.get = <T>(path: string) => api<T>(path, { method: 'GET' });
api.post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
api.patch = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body });
api.put = <T>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body });
api.delete = <T>(path: string) => api<T>(path, { method: 'DELETE' });

