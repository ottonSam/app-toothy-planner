import { z } from 'zod';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

type RequestOptions<TBody> = {
  body?: TBody;
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT';
  schema?: z.ZodType;
  skipAuthRefresh?: boolean;
};

const apiErrorSchema = z.object({
  message: z.string().optional(),
});

const apiErrorMessagesPt: Record<string, string> = {
  'Category is associated with expenses':
    'A categoria esta vinculada a gastos e nao pode ser removida.',
  'Category name already exists': 'Ja existe uma categoria com esse nome.',
  'Category not found': 'Categoria nao encontrada.',
  'Cycle not found': 'Ciclo financeiro nao encontrado.',
  'DeepSeek API key is not configured': 'O servico de consulta nutricional nao esta configurado.',
  'DeepSeek authentication failed': 'Nao foi possivel autenticar no servico nutricional.',
  'DeepSeek nutrition lookup failed': 'Nao foi possivel consultar os dados nutricionais.',
  'DeepSeek nutrition response is invalid': 'O servico retornou dados nutricionais invalidos.',
  'Diet entry not found': 'Entrada de alimentacao nao encontrada.',
  'Diet entry quantity must be greater than zero': 'A quantidade deve ser maior que zero.',
  'Diet entry unit is required': 'Selecione a unidade da entrada.',
  'Diet goal carbohydrate must be greater than or equal to zero':
    'O carboidrato deve ser maior ou igual a zero.',
  'Diet goal fat must be greater than or equal to zero':
    'A gordura deve ser maior ou igual a zero.',
  'Diet goal kcal must be greater than or equal to zero':
    'As calorias devem ser maiores ou iguais a zero.',
  'Diet goal protein must be greater than or equal to zero':
    'A proteina deve ser maior ou igual a zero.',
  'Expense not found': 'Gasto nao encontrado.',
  'Food name is required': 'Informe o nome do alimento.',
  'Food not found': 'Alimento nao encontrado.',
  'Failed to fetch': 'Nao foi possivel conectar ao servidor. Verifique sua conexao.',
  'Inform either total amount or installment amount, but not both':
    'Informe o valor total ou o valor da parcela, mas nao os dois.',
  'Installment expense not found': 'Parcelamento nao encontrado.',
  'Invalid request body': 'Os dados enviados sao invalidos.',
  'Invalid request parameter': 'Um dos parametros informados e invalido.',
  'Recurring expense is canceled': 'A recorrencia ja foi cancelada.',
  'Recurring expense not found': 'Recorrencia nao encontrada.',
  'Wallet description already exists': 'Ja existe uma carteira com essa descricao.',
  'Wallet is associated with cycles or expenses':
    'A carteira possui ciclos ou gastos vinculados e nao pode ser removida.',
  'Wallet not found': 'Carteira nao encontrada.',
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshSessionPromise: Promise<void> | null = null;

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return apiErrorMessagesPt[error.message] ?? error.message;
  }

  return 'Nao foi possivel concluir a requisicao. Tente novamente.';
}

export function getApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (path.startsWith('/api/')) {
    try {
      return `${new URL(API_BASE_URL).origin}${path}`;
    } catch {
      return path;
    }
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
) {
  const response = await requestWithAuthRefresh(path, options);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const data = await response.json();
  return options.schema ? (options.schema.parse(data) as TResponse) : (data as TResponse);
}

async function requestWithAuthRefresh<TBody>(path: string, options: RequestOptions<TBody>) {
  const response = await performRequest(path, options);

  if (!shouldRefreshAuthentication(response) || options.skipAuthRefresh) {
    await throwWhenNotOk(response);
    return response;
  }

  try {
    await refreshSession();
  } catch {
    await throwWhenNotOk(response);
    return response;
  }

  const retryResponse = await performRequest(path, options);
  await throwWhenNotOk(retryResponse);
  return retryResponse;
}

function shouldRefreshAuthentication(response: Response) {
  return response.status === 401 || response.status === 403;
}

async function performRequest<TBody>(path: string, options: RequestOptions<TBody>) {
  const headers: Record<string, string> = {};
  const hasBody = options.body !== undefined;

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(getApiUrl(path), {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
}

async function throwWhenNotOk(response: Response) {
  if (!response.ok) {
    const fallback = `Erro ${response.status} ao comunicar com a API.`;
    const parsed = apiErrorSchema.safeParse(await readJson(response));
    throw new ApiError(parsed.data?.message ?? fallback, response.status);
  }
}

async function refreshSession() {
  refreshSessionPromise ??= performRequest('/users/refresh', {
    method: 'GET',
    skipAuthRefresh: true,
  })
    .then(throwWhenNotOk)
    .then(() => undefined)
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
