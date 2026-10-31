import type { Meta, StoryObj } from "@storybook/preact-vite";
import { render } from "preact";
import { expect, spyOn, waitFor } from "storybook/test";
import { App } from "../src/app";
import { conversion, convert, load, reset } from "../src/converter";
import type { Currency } from "../src/api";

const currencyList: Currency[] = [
  { short_code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { short_code: "AUD", name: "Australian Dollar", symbol: "$" },
  { short_code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { short_code: "EUR", name: "Euro", symbol: "€" },
  { short_code: "GBP", name: "British Pound", symbol: "£" },
  { short_code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { short_code: "USD", name: "US Dollar", symbol: "$" },
];
const rates: Record<string, number> = {
  AED: 3.67,
  AUD: 1.5,
  CAD: 1.35,
  EUR: 0.9,
  GBP: 0.8,
  JPY: 150,
  USD: 1,
};

function mockApi({
  listFailures = 0,
  conversionFailures = 0,
  empty = false,
  selectCurrencies = true,
} = {}) {
  reset();
  if (selectCurrencies) {
    conversion.from.currency.value = "USD";
    conversion.to.currency.value = "EUR";
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      window.location.href,
    );
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) {
      return originalFetch(input, init);
    }
    if (new Headers(init?.headers).has("Authorization")) {
      throw new Error("Browser requests must not contain API credentials");
    }
    if (url.pathname === "/api/currencies") {
      if (listFailures-- > 0) return new Response(null, { status: 502 });
      return Response.json({ response: empty ? [] : currencyList });
    }
    if (conversionFailures-- > 0) return new Response(null, { status: 503 });
    const amount = Number(url.searchParams.get("amount"));
    const from = url.searchParams.get("from") ?? "USD";
    const to = url.searchParams.get("to") ?? "EUR";
    return Response.json({
      response: { value: Number(((amount * rates[to]) / rates[from]).toFixed(6)) },
    });
  };
  return () => {
    globalThis.fetch = originalFetch;
    reset();
  };
}

const meta = {
  title: "Currency converter",
  component: App,
  // The Preact Storybook renderer does not return an unmount callback.
  beforeEach:
    ({ canvasElement }) =>
    () =>
      render(null, canvasElement),
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConvertAndSwap: Story = {
  beforeEach: () => mockApi({ selectCurrencies: false }),
  play: async ({ canvas, userEvent }) => {
    const amount = await canvas.findByRole("textbox", { name: "Amount to convert" });
    const result = canvas.getByRole("textbox", { name: "Converted amount" });
    const from = await canvas.findByRole("button", { name: "From currency: AED" });
    await expect(canvas.getByRole("button", { name: "To currency: AUD" })).toBeVisible();
    await waitFor(() => expect(result).toHaveValue("0.408719"));
    await userEvent.click(from);
    await userEvent.type(canvas.getByRole("combobox", { name: "Search from currency" }), "usd");
    await userEvent.click(canvas.getByRole("option", { name: "USD US Dollar" }));
    await userEvent.click(canvas.getByRole("button", { name: "To currency: AUD" }));
    await userEvent.type(canvas.getByRole("combobox", { name: "Search to currency" }), "eur");
    await userEvent.click(canvas.getByRole("option", { name: "EUR Euro" }));
    await waitFor(() => expect(result).toHaveValue("0.9"));
    await userEvent.clear(amount);
    await userEvent.type(amount, "100");
    await waitFor(() => expect(result).toHaveValue("90"));
    await userEvent.click(canvas.getByRole("button", { name: "Swap currencies" }));
    await expect(amount).toHaveValue("90");
    await expect(canvas.getByRole("button", { name: "From currency: EUR" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "To currency: USD" })).toBeVisible();
    await waitFor(() => expect(result).toHaveValue("100"));
    await expect(result).toHaveAttribute("readonly");
  },
};

export const SearchCurrencies: Story = {
  beforeEach: () => mockApi(),
  play: async ({ canvas, userEvent }) => {
    const trigger = await canvas.findByRole("button", { name: "From currency: USD" });
    await userEvent.click(trigger);
    const search = canvas.getByRole("combobox", { name: "Search from currency" });
    await waitFor(() => expect(search).toHaveFocus());
    await expect(canvas.getAllByRole("option")).toHaveLength(5);
    await expect(
      canvas.getByRole("option", { name: "AED United Arab Emirates Dirham" }),
    ).toBeVisible();
    await expect(canvas.queryByRole("option", { name: "USD US Dollar" })).not.toBeInTheDocument();
    await userEvent.type(search, "yen");
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(canvas.getByRole("option", { name: "JPY Japanese Yen" })).toBeVisible();
    await userEvent.clear(search);
    await userEvent.type(search, "unknown");
    await expect(canvas.getByText("No currencies found.")).toBeVisible();
    await expect(canvas.queryAllByRole("option")).toHaveLength(0);
    await userEvent.clear(search);
    await userEvent.type(search, "usd");
    await expect(canvas.getByRole("option", { name: "USD US Dollar" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveFocus();
    await expect(canvas.queryByRole("combobox")).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByRole("combobox")).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(canvas.getByRole("button", { name: "From currency: AUD" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "To currency: EUR" }));
    await userEvent.type(canvas.getByRole("combobox", { name: "Search to currency" }), "gbp");
    await userEvent.click(canvas.getByRole("option", { name: "GBP British Pound" }));
    await expect(canvas.getByRole("button", { name: "To currency: GBP" })).toHaveFocus();
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.533333"),
    );
    await userEvent.click(canvas.getByRole("button", { name: "From currency: AUD" }));
    await userEvent.click(canvas.getByRole("textbox", { name: "Amount to convert" }));
    await expect(canvas.queryByRole("combobox")).not.toBeInTheDocument();
  },
};

export const OpenDropdown: Story = {
  beforeEach: () => mockApi(),
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
    );
    await userEvent.click(await canvas.findByRole("button", { name: "From currency: USD" }));
    await expect(canvas.getAllByRole("option")).toHaveLength(5);
  },
};

export const OpenDestinationDropdown: Story = {
  beforeEach: () => mockApi(),
  play: async ({ canvas, userEvent }) => {
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
    );
    await userEvent.click(canvas.getByRole("button", { name: "To currency: EUR" }));
    await expect(canvas.getAllByRole("option")).toHaveLength(5);
  },
};

export const InvalidAmount: Story = {
  beforeEach: () => mockApi(),
  play: async ({ canvas, userEvent }) => {
    const amount = canvas.getByRole("textbox", { name: "Amount to convert" });
    const result = canvas.getByRole("textbox", { name: "Converted amount" });
    await waitFor(() => expect(result).toHaveValue("0.9"));
    await userEvent.clear(amount);
    await userEvent.type(amount, "001");
    await expect(amount).toHaveValue("1");
    await userEvent.clear(amount);
    await userEvent.type(amount, "000");
    await expect(amount).toHaveValue("0");
    await waitFor(() => expect(result).toHaveValue("0"));
    await userEvent.type(amount, ".");
    await expect(amount).toHaveValue("0.");
    await userEvent.type(amount, "050");
    await expect(amount).toHaveValue("0.050");
    await waitFor(() => expect(result).toHaveValue("0.045"));
    await userEvent.clear(amount);
    await userEvent.paste("00012.50");
    await expect(amount).toHaveValue("12.50");
    await userEvent.keyboard("{Home}06");
    await expect(amount).toHaveValue("612.50");
    await userEvent.clear(amount);
    await userEvent.paste("0009007199254740993.0500");
    await expect(amount).toHaveValue("9007199254740993.0500");
    await userEvent.clear(amount);
    await userEvent.type(amount, "000,");
    await expect(amount).toHaveValue("0,");
    await userEvent.type(amount, "050");
    await expect(amount).toHaveValue("0,050");
    await waitFor(() => expect(result).toHaveValue("0.045"));
    await userEvent.clear(amount);
    await userEvent.paste("000x10");
    await expect(amount).toHaveValue("000x10");
    await expect(amount).toHaveAccessibleDescription("Enter a valid amount");
    const request = spyOn(globalThis, "fetch");
    try {
      await userEvent.clear(amount);
      await expect(result).toHaveValue("");
      await expect(conversion.error.value).toBe("");
      await userEvent.type(amount, "invalid");
      await expect(amount).toHaveAccessibleDescription("Enter a valid amount");
      await expect(canvas.getByRole("status")).toHaveTextContent("Enter a valid amount");
      await expect(conversion.error.value).toBe("Enter a valid amount");
      await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
      await expect(request).not.toHaveBeenCalled();
      await expect(canvas.getByRole("status")).toHaveTextContent("Enter a valid amount");
      await userEvent.clear(amount);
      await expect(conversion.error.value).toBe("");
      await userEvent.type(amount, "25,50");
      await waitFor(() => expect(result).toHaveValue("22.95"));
      await expect(conversion.error.value).toBe("");
      await expect(request).toHaveBeenCalledTimes(1);
    } finally {
      request.mockRestore();
    }
  },
};

export const CurrencyListError: Story = {
  beforeEach: () => mockApi({ listFailures: 1 }),
  play: async ({ canvas, userEvent }) => {
    const retry = await canvas.findByRole("button", { name: "Try again" });
    await expect(canvas.getByRole("textbox", { name: "Amount to convert" })).toBeDisabled();
    await expect(canvas.getByRole("status")).toHaveTextContent("We couldn't load currencies");
    await userEvent.click(retry);
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
    );
    const pending = deferred();
    let signal: AbortSignal | null | undefined;
    const request = spyOn(globalThis, "fetch").mockImplementationOnce(async (_input, init) => {
      signal = init?.signal;
      await pending.promise;
      return Response.json({ response: [] });
    });
    try {
      load();
      load();
      await expect(signal?.aborted).toBe(true);
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: "From currency: USD" })).toBeEnabled(),
      );
      pending.resolve();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await expect(canvas.getByRole("button", { name: "From currency: USD" })).toBeEnabled();
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
      );
    } finally {
      pending.resolve();
      request.mockRestore();
    }
  },
};

export const ConversionError: Story = {
  beforeEach: () => mockApi({ conversionFailures: 1 }),
  play: async ({ canvas, userEvent }) => {
    const retry = await canvas.findByRole("button", { name: "Try again" });
    await expect(canvas.getByRole("status")).toHaveTextContent("We couldn't convert this amount");
    await expect(conversion.error.value).toBe("We couldn't convert this amount. Please try again.");
    await expect(
      canvas.getByRole("textbox", { name: "Amount to convert" }),
    ).toHaveAccessibleDescription(conversion.error.value);
    await expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("");
    await userEvent.click(retry);
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
    );
    await expect(conversion.error.value).toBe("");
    await expect(canvas.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    const request = spyOn(globalThis, "fetch");
    try {
      convert();
      expect(request).toHaveBeenCalledTimes(1);
      const signal = request.mock.calls[0]?.[1]?.signal;
      convert();
      expect(request).toHaveBeenCalledTimes(2);
      expect(signal?.aborted).toBe(true);
      await waitFor(() =>
        expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("0.9"),
      );
    } finally {
      request.mockRestore();
    }
  },
};

export const EmptyCurrencies: Story = {
  beforeEach: () => mockApi({ empty: true }),
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No currencies are available right now.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Swap currencies" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "From currency: Choose" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Try again" })).toBeVisible();
  },
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

let staleRequests: Record<
  string,
  {
    started: ReturnType<typeof deferred>;
    released: ReturnType<typeof deferred>;
    completed: ReturnType<typeof deferred>;
    signal?: AbortSignal | null;
  }
>;

export const StaleConversion: Story = {
  beforeEach: () => {
    staleRequests = Object.fromEntries(
      ["100", "101", "102", "103", "104"].map((amount) => [
        amount,
        { started: deferred(), released: deferred(), completed: deferred() },
      ]),
    );
    const restore = mockApi();
    const fixtureFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
        window.location.href,
      );
      const amount = url.searchParams.get("amount") ?? "";
      const request = staleRequests[amount];
      if (!request) return fixtureFetch(input, init);
      request.signal = init?.signal;
      request.started.resolve();
      if (amount === "103") {
        request.signal?.addEventListener("abort", request.released.resolve, { once: true });
      }
      await request.released.promise;
      try {
        if (amount === "103") request.signal?.throwIfAborted();
        return amount === "102"
          ? new Response(null, { status: 503 })
          : await fixtureFetch(input, init);
      } finally {
        request.completed.resolve();
      }
    };
    return () => {
      for (const request of Object.values(staleRequests)) request.released.resolve();
      restore();
    };
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const amount = canvas.getByRole("textbox", { name: "Amount to convert" });
    const result = canvas.getByRole("textbox", { name: "Converted amount" });
    await waitFor(() => expect(result).toHaveValue("0.9"));
    await userEvent.clear(amount);
    await userEvent.type(amount, "100");
    await staleRequests["100"].started.promise;
    await userEvent.clear(amount);
    await userEvent.type(amount, "200");
    await waitFor(() => expect(result).toHaveValue("180"));
    await expect(staleRequests["100"].signal?.aborted).toBe(true);
    staleRequests["100"].released.resolve();
    await staleRequests["100"].completed.promise;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await expect(result).toHaveValue("180");
    for (const text of ["101", "102", "103"]) {
      const request = staleRequests[text];
      await userEvent.clear(amount);
      await userEvent.type(amount, text);
      await request.started.promise;
      await userEvent.clear(amount);
      await userEvent.type(amount, "invalid");
      await expect(request.signal?.aborted).toBe(true);
      request.released.resolve();
      await request.completed.promise;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await expect(result).toHaveValue("");
      await expect(amount).toHaveAccessibleDescription("Enter a valid amount");
      await expect(canvas.getByRole("status")).toHaveTextContent("Enter a valid amount");
      await expect(canvas.getByRole("button", { name: "Try again" })).toBeVisible();
    }
    await userEvent.clear(amount);
    await userEvent.type(amount, "104");
    await staleRequests["104"].started.promise;
    render(null, canvasElement);
    await expect(staleRequests["104"].signal?.aborted).toBe(true);
    staleRequests["104"].released.resolve();
    await staleRequests["104"].completed.promise;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await expect(conversion.to.amount.peek()).toBe("");
    await expect(conversion.loading.peek()).toBe(false);
    render(<App />, canvasElement);
    const restoredAmount = await canvas.findByRole("textbox", { name: "Amount to convert" });
    await waitFor(() => expect(restoredAmount).toBeEnabled());
    await userEvent.clear(restoredAmount);
    await userEvent.type(restoredAmount, "200");
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Converted amount" })).toHaveValue("180"),
    );
  },
};
