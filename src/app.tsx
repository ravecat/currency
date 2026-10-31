import { conversion, convert, currencies, load, normalize, swap } from "./converter";
import { CurrencySelect } from "./currency-select";

export function App() {
  const data = currencies.value.value;
  const loading = currencies.loading.value;
  const error = currencies.error.value || conversion.error.value;
  const disabled = !currencies.ready.value;
  const showFeedback = !loading && (!!error || data.length === 0);
  const message = loading
    ? "Loading currencies..."
    : error ||
      (data.length === 0 ? "No currencies are available right now." : "") ||
      (conversion.loading.value ? "Converting..." : "") ||
      (conversion.to.amount.value
        ? `${conversion.from.amount.value} ${conversion.from.currency.value} = ${conversion.to.amount.value} ${conversion.to.currency.value}`
        : "Enter an amount to convert.");

  return (
    <main class="converter-page">
      <form
        class="converter"
        aria-label="Currency converter"
        onSubmit={(event) => event.preventDefault()}
      >
        <div class="converter__fields">
          <div class="converter__side">
            <CurrencySelect
              label="From"
              value={conversion.from.currency.value}
              currencies={data}
              disabled={disabled}
              onChange={(value) => {
                conversion.from.currency.value = value;
              }}
            />
            <input
              id="from-amount"
              class="converter__amount"
              aria-label="Amount to convert"
              aria-describedby="conversion-status"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={conversion.from.amount.value}
              disabled={disabled}
              onInput={(event) => {
                const input = event.currentTarget;
                const value = normalize(input.value);
                if (value !== input.value) {
                  const start = input.value.search(/\d/);
                  input.setRangeText(
                    "",
                    start,
                    start + input.value.length - value.length,
                    "preserve",
                  );
                }
                conversion.from.amount.value = value;
              }}
            />
          </div>
          <button
            type="button"
            class="converter__swap"
            aria-label="Swap currencies"
            disabled={disabled}
            onClick={swap}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div class="converter__side">
            <CurrencySelect
              label="To"
              value={conversion.to.currency.value}
              currencies={data}
              disabled={disabled}
              onChange={(value) => {
                conversion.to.currency.value = value;
              }}
            />
            <input
              id="to-amount"
              class="converter__amount"
              aria-label="Converted amount"
              aria-describedby="conversion-status"
              type="text"
              inputMode="decimal"
              placeholder={conversion.loading.value ? "..." : "0.00"}
              value={conversion.to.amount.value}
              readOnly
              aria-busy={conversion.loading.value}
            />
          </div>
        </div>
        <div class={showFeedback ? "converter__feedback" : "sr-only"}>
          <output id="conversion-status" class="converter__status" aria-live="polite">
            {message}
          </output>
          {showFeedback && (
            <button type="button" class="converter__retry" onClick={disabled ? load : convert}>
              Try again
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
