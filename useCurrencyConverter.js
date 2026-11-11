// VIEWMODEL — coordena estados, validações e o fluxo da conversão.
// Não desenha interface (isso é da View) e não faz fetch direto (isso é do Model).

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrencies, getRate } from '../models/currencyModel';

const DEFAULT_FROM = 'USD';
const DEFAULT_TO = 'BRL';

// Aceita "10", "10.5" e "10,50". Rejeita entradas ambíguas como "1.000,50",
// "1,000.50", "1,2,3" ou texto. Retorna número ou null.
export function parseAmount(text) {
  const value = String(text ?? '').trim();
  if (!/^\d+([.,]\d+)?$/.test(value)) return null;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

export function validateInput({ amountText, from, to }) {
  if (!String(amountText ?? '').trim()) {
    return { error: 'Digite um valor para converter.' };
  }
  const amount = parseAmount(amountText);
  if (amount === null) {
    return {
      error:
        'Valor inválido. Use apenas números, com vírgula ou ponto para decimais (ex.: 10,50).',
    };
  }
  if (amount <= 0) return { error: 'O valor deve ser maior que zero.' };
  if (!from) return { error: 'Selecione a moeda de origem.' };
  if (!to) return { error: 'Selecione a moeda de destino.' };
  if (from === to) return { error: 'Escolha moedas diferentes para a conversão.' };
  return { amount };
}

function formatMoney(value, currency) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch (e) {
    // Código sem suporte no Intl do dispositivo.
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${currency}`;
  }
}

function formatDate(isoDate) {
  const [y, m, d] = String(isoDate).split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export function useCurrencyConverter() {
  const [amountText, setAmountText] = useState('');
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currenciesError, setCurrenciesError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);

  // Identifica a consulta mais recente: respostas antigas são descartadas.
  const requestId = useRef(0);
  const controller = useRef(null);

  const loadCurrencies = useCallback(async () => {
    setLoadingCurrencies(true);
    setCurrenciesError(null);
    try {
      const list = await getCurrencies();
      setCurrencies(list);
      const codes = new Set(list.map((c) => c.code));
      // Moedas iniciais precisam existir na lista retornada pela API.
      setFrom((cur) => (codes.has(cur) ? cur : list[0].code));
      setTo((cur) => (codes.has(cur) ? cur : list[Math.min(1, list.length - 1)].code));
    } catch (error) {
      setCurrenciesError(
        error.message || 'Não foi possível carregar a lista de moedas.'
      );
    } finally {
      setLoadingCurrencies(false);
    }
  }, []);

  useEffect(() => {
    loadCurrencies();
    return () => {
      if (controller.current) controller.current.abort();
    };
  }, [loadCurrencies]);

  // Qualquer alteração nos campos invalida o resultado e os erros anteriores,
  // para nunca mostrar um valor antigo como se fosse da consulta atual.
  const resetFeedback = () => {
    setResult(null);
    setValidationError(null);
    setApiError(null);
  };

  const changeAmount = (text) => {
    setAmountText(text);
    resetFeedback();
  };
  const changeFrom = (code) => {
    setFrom(code);
    resetFeedback();
  };
  const changeTo = (code) => {
    setTo(code);
    resetFeedback();
  };
  const swapCurrencies = () => {
    setFrom(to);
    setTo(from);
    resetFeedback();
  };

  const convert = useCallback(async () => {
    if (loading) return; // impede consultas simultâneas

    const validation = validateInput({ amountText, from, to });
    setApiError(null);
    if (validation.error) {
      setResult(null);
      setValidationError(validation.error);
      return;
    }
    setValidationError(null);
    setResult(null);

    const id = ++requestId.current;
    if (controller.current) controller.current.abort();
    controller.current = new AbortController();
    setLoading(true);

    try {
      const data = await getRate(from, to, controller.current.signal);
      if (id !== requestId.current) return; // resposta antiga: ignora

      const converted = validation.amount * data.rate; // sem usar valor arredondado
      setResult({
        amountText: formatMoney(validation.amount, from),
        convertedText: formatMoney(converted, to),
        from,
        to,
        rateText: `1 ${from} = ${data.rate.toLocaleString('pt-BR', {
          maximumFractionDigits: 6,
        })} ${to}`,
        dateText: formatDate(data.date),
      });
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      if (id !== requestId.current) return;
      setApiError(error.message || 'Não foi possível obter a taxa de câmbio.');
    } finally {
      if (id === requestId.current) setLoading(false); // sempre encerra o loading
    }
  }, [amountText, from, to, loading]);

  return {
    amountText,
    from,
    to,
    currencies,
    loadingCurrencies,
    currenciesError,
    loading,
    validationError,
    apiError,
    result,
    changeAmount,
    changeFrom,
    changeTo,
    swapCurrencies,
    convert,
    reloadCurrencies: loadCurrencies,
  };
}