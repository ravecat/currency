import { batch, computed, effect, signal } from "@preact/signals";
import { coerce, minLength, overwrite, pipe, string, trim } from "zod/mini";
import {
  convert as requestConversion,
  currencies as requestCurrencies,
  ServiceUnavailableError,
  type Currency,
} from "./api";

const amountTextSchema = pipe(
  string().check(
    trim(),
    minLength(1),
    overwrite((value) => value.replace(",", ".")),
  ),
  coerce.number(),
);

const parse = (value: string): number | null => {
  const result = amountTextSchema.safeParse(value);
  return result.success ? result.data : null;
};

export const normalize = (value: string): string =>
  parse(value) === null ? value : value.replace(/^(\s*[+-]?)0+(?=\d)/, "$1");

const from = { amount: signal(""), currency: signal("") };
const to = { amount: computed(() => result.value.amount), currency: signal("") };
let listController: AbortController | undefined;
let conversionController: AbortController | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let stopConversion: (() => void) | undefined;

const cancelConversion = () => {
  conversionController?.abort();
  clearTimeout(timer);
  timer = undefined;
};

const list = signal<{ data: Currency[]; loading: boolean; error: string }>(
  { data: [], loading: true, error: "" },
  {
    watched() {
      void load();
    },
    unwatched() {
      listController?.abort();
      list.value = { data: [], loading: true, error: "" };
    },
  },
);

const result = signal(
  { amount: "", loading: false, error: "" },
  {
    watched() {
      stopConversion = effect(() => {
        const { amount, from, to, ready } = requestInput.value;
        cancelConversion();
        const valid = ready && amount !== null && !!from && !!to;
        result.value = { amount: "", loading: valid, error: "" };
        if (valid) timer = setTimeout(() => void convert(), 300);
        return cancelConversion;
      });
    },
    unwatched() {
      stopConversion?.();
      stopConversion = undefined;
      cancelConversion();
      result.value = { ...result.peek(), loading: false };
    },
  },
);

export const currencies = {
  value: computed(() => list.value.data),
  ready: computed(() => {
    const { data, loading, error } = list.value;
    return !loading && !error && data.length > 0;
  }),
  loading: computed(() => list.value.loading),
  error: computed(() => list.value.error),
};

const requestInput = computed(() => ({
  amount: parse(from.amount.value),
  from: from.currency.value,
  to: to.currency.value,
  ready: currencies.ready.value,
}));

export const conversion = {
  from,
  to,
  loading: computed(() => result.value.loading),
  error: computed(() => {
    const error = result.value.error;
    if (from.amount.value.trim() !== "" && parse(from.amount.value) === null) {
      return "Enter a valid amount";
    }
    return error;
  }),
};

export const load = async (): Promise<void> => {
  listController?.abort();
  listController = new AbortController();
  const { signal } = listController;
  list.value = { ...list.peek(), loading: true, error: "" };
  try {
    const data = await requestCurrencies(signal);
    if (signal.aborted) return;
    batch(() => {
      const hasCurrency = (code: string) => data.some((currency) => currency.short_code === code);
      if (!hasCurrency(from.currency.peek())) {
        from.currency.value = data[0]?.short_code ?? "";
      }
      if (!hasCurrency(to.currency.peek())) {
        to.currency.value =
          data.find((currency) => currency.short_code !== from.currency.peek())?.short_code ??
          from.currency.peek();
      }
      if (!from.amount.peek()) from.amount.value = "1";
      list.value = { data, loading: false, error: "" };
    });
  } catch (error) {
    if (signal.aborted) return;
    list.value = {
      ...list.peek(),
      loading: false,
      error:
        error instanceof ServiceUnavailableError
          ? "The currency service is not available. Please try again later."
          : "We couldn't load currencies. Please try again.",
    };
  }
};

export const convert = async (): Promise<void> => {
  cancelConversion();
  const input = requestInput.peek();
  const { amount, from, to, ready } = input;
  const valid = ready && amount !== null && !!from && !!to;
  result.value = { amount: "", loading: valid, error: "" };
  if (!valid) return;
  conversionController = new AbortController();
  const { signal } = conversionController;
  const current = () => !signal.aborted && requestInput.peek() === input;
  try {
    const value = await requestConversion({ from, to, amount }, signal);
    if (!current()) return;
    result.value = { amount: String(value), loading: false, error: "" };
  } catch {
    if (!current()) return;
    result.value = {
      amount: "",
      loading: false,
      error: "We couldn't convert this amount. Please try again.",
    };
  } finally {
    if (!signal.aborted && result.peek().loading) {
      result.value = { ...result.peek(), loading: false };
    }
  }
};

export const swap = (): void => {
  cancelConversion();
  batch(() => {
    const amount = from.amount.peek();
    from.amount.value = result.peek().amount;
    result.value = { amount, loading: false, error: "" };
    [from.currency.value, to.currency.value] = [to.currency.peek(), from.currency.peek()];
  });
};

export const reset = (): void => {
  cancelConversion();
  batch(() => {
    from.amount.value = "";
    from.currency.value = "";
    to.currency.value = "";
    result.value = { amount: "", loading: false, error: "" };
  });
};
