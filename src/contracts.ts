import { array, looseObject, number, object, regex, string, type infer as Infer } from "zod/mini";

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
export type Currency = Infer<typeof currencySchema>;
