import { array, looseObject, number, object, regex, string, type infer as Infer } from "zod/mini";

const key = import.meta.env.VITE_CURRENCYBEACON_API_KEY ?? "";

export class ServiceUnavailableError extends Error {}

const currencyCodeSchema = string().check(regex(/\S/u));

export const convertInputSchema = object({
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  amount: number(),
});

export const conversionResponseSchema = object({
  response: object({ value: number() }),
});

export const currencySchema = looseObject({
  name: string(),
  short_code: string(),
  symbol: string(),
});

export const currenciesResponseSchema = object({ response: array(currencySchema) });

export type ConvertInput = Infer<typeof convertInputSchema>;
export type ConversionResponse = Infer<typeof conversionResponseSchema>;
export type Currency = Infer<typeof currencySchema>;
export type CurrenciesResponse = Infer<typeof currenciesResponseSchema>;

export async function convert(input: ConvertInput, signal?: AbortSignal): Promise<number> {
  if (!key) throw new ServiceUnavailableError("Conversion service is unavailable");
  const parsedInput = convertInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error("Conversion requires currencies and a finite amount");
  }

  const params = new URLSearchParams({
    from: parsedInput.data.from,
    to: parsedInput.data.to,
    amount: String(parsedInput.data.amount),
  });
  const response = await fetch(`/api/convert?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
    signal,
  }).catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Unable to reach conversion service", { cause });
  });
  if (!response.ok) throw new Error(`Conversion service request failed (${response.status})`);

  const body: unknown = await response.json().catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Invalid conversion response", { cause });
  });
  const result = conversionResponseSchema.safeParse(body);
  if (!result.success) {
    throw new Error("Invalid conversion response");
  }
  return result.data.response.value;
}

export async function currencies(signal?: AbortSignal): Promise<Currency[]> {
  if (!key) throw new ServiceUnavailableError("Conversion service is unavailable");

  const response = await fetch("/api/currencies", {
    headers: { Authorization: `Bearer ${key}` },
    signal,
  }).catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Unable to reach conversion service", { cause });
  });
  if (!response.ok) throw new Error(`Conversion service request failed (${response.status})`);

  const body: unknown = await response.json().catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Invalid currency list response", { cause });
  });
  const result = currenciesResponseSchema.safeParse(body);
  if (!result.success) {
    throw new Error("Invalid currency list response");
  }
  return result.data.response;
}
