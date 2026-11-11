// MODEL — acesso à API Frankfurter.
// Não conhece botões, telas nem estados da interface: só busca, valida e devolve dados.

const BASE_URL = 'https://api.frankfurter.dev/v2';

// Erro com um "tipo", para o ViewModel saber diferenciar o problema.
//   network -> falha de conexão
//   http    -> a API respondeu com status de erro (4xx/5xx)
//   invalid -> resposta sem os dados esperados
export class ApiError extends Error {
  constructor(type, message, status) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

async function request(path, signal) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal });
  } catch (error) {
    if (error && error.name === 'AbortError') throw error;
    throw new ApiError(
      'network',
      'Não foi possível conectar ao serviço de câmbio. Verifique sua internet.'
    );
  }

  if (!response.ok) {
    throw new ApiError(
      'http',
      `O serviço de câmbio retornou um erro (código ${response.status}).`,
      response.status
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('invalid', 'A resposta do serviço de câmbio é inválida.');
  }
}

// Normaliza a lista de moedas para [{ code, name }].
// Aceita tanto um array de objetos quanto um objeto { USD: "United States Dollar" }.
function normalizeCurrencies(data) {
  let list = [];

  if (Array.isArray(data)) {
    list = data.map((item) => ({
      code: item && (item.iso_code || item.code || item.currency),
      name: item && item.name,
    }));
  } else if (data && typeof data === 'object') {
    list = Object.entries(data).map(([code, value]) => ({
      code,
      name: typeof value === 'string' ? value : value && value.name,
    }));
  }

  return list
    .filter((c) => typeof c.code === 'string' && c.code.length > 0)
    .map((c) => ({ code: c.code.toUpperCase(), name: c.name || c.code }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getCurrencies(signal) {
  const data = await request('/currencies', signal);
  const currencies = normalizeCurrencies(data);

  if (currencies.length === 0) {
    throw new ApiError('invalid', 'A lista de moedas veio vazia ou em formato inesperado.');
  }
  return currencies;
}

// Taxa de 1 unidade de `base` expressa em `quote`.
// A ordem importa: USD->BRL é diferente de BRL->USD.
export async function getRate(base, quote, signal) {
  const data = await request(
    `/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
    signal
  );

  const rate = Number(data && data.rate);
  if (!Number.isFinite(rate) || rate <= 0 || typeof data.date !== 'string') {
    throw new ApiError('invalid', 'O serviço não retornou a taxa de câmbio esperada.');
  }

  return { base, quote, rate, date: data.date };
}