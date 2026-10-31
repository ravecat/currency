import {
  convertInputSchema,
  conversionResponseSchema,
  currenciesResponseSchema,
  type ConvertInput,
  type Currency,
} from "./contracts";

export type { ConvertInput, Currency } from "./contracts";

export class ServiceUnavailableError extends Error {}

export async function convert(input: ConvertInput, signal?: AbortSignal): Promise<number> {
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
    signal,
  }).catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Unable to reach conversion service", { cause });
  });
  if (response.status === 503)
    throw new ServiceUnavailableError("Conversion service is unavailable");
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
  const response = await fetch("/api/currencies", {
    signal,
  }).catch((cause: unknown) => {
    signal?.throwIfAborted();
    throw new Error("Unable to reach conversion service", { cause });
  });
  if (response.status === 503)
    throw new ServiceUnavailableError("Conversion service is unavailable");
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
