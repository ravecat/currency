/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The search input controls a custom listbox through aria-activedescendant. */
import type { JSX } from "preact";
import { useLayoutEffect, useId, useRef, useState } from "preact/hooks";
import type { Currency } from "./api";

type CurrencySelectProps = {
  label: string;
  value: string;
  currencies: Currency[];
  disabled: boolean;
  onChange: (value: string) => void;
};

export function CurrencySelect({
  label,
  value,
  currencies,
  disabled,
  onChange,
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const matches = currencies.filter(
    (currency) =>
      currency.short_code.toLowerCase().includes(normalizedQuery) ||
      currency.name.toLowerCase().includes(normalizedQuery),
  );
  const visible = matches.slice(0, 5);

  useLayoutEffect(() => {
    if (!open) return;
    search.current?.focus({ preventScroll: true });
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function choose(code: string) {
    onChange(code);
    close();
  }

  function dismissOnBlur(event: JSX.TargetedFocusEvent<HTMLDivElement>) {
    const target = event.relatedTarget;
    if (!(target instanceof Node) || !event.currentTarget.contains(target)) setOpen(false);
  }

  function toggle() {
    setQuery("");
    setActiveIndex(0);
    setOpen(!open);
  }

  function openOnArrowKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setQuery("");
      setActiveIndex(0);
      setOpen(true);
    }
  }

  function updateQuery(event: JSX.TargetedInputEvent<HTMLInputElement>) {
    setQuery(event.currentTarget.value);
    setActiveIndex(0);
  }

  function handleSearchKeyDown(event: KeyboardEvent) {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.max(0, Math.min(visible.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const currency = visible[activeIndex];
      if (currency) choose(currency.short_code);
    }
  }

  function keepSearchFocus(event: PointerEvent) {
    event.preventDefault();
  }

  function highlightOption(index: number) {
    setActiveIndex(index);
  }

  function chooseOnKey(event: KeyboardEvent, code: string) {
    if (event.key === "Enter" || event.key === " ") choose(code);
  }

  return (
    <div class="currency-select" ref={root} onBlur={dismissOnBlur}>
      <button
        ref={trigger}
        type="button"
        class="currency-select__trigger"
        aria-label={`${label} currency: ${value || "Choose"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={openOnArrowKey}
      >
        <span class="currency-select__code">{value || "---"}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.7" />
        </svg>
      </button>
      {open && (
        <div class="currency-select__panel">
          <div class="currency-select__search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6" />
              <path d="m16 16 4 4" stroke="currentColor" stroke-width="1.6" />
            </svg>
            <input
              ref={search}
              type="search"
              class="currency-select__search"
              role="combobox"
              aria-label={`Search ${label.toLowerCase()} currency`}
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={visible[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              placeholder="Search name or code"
              autoComplete="off"
              value={query}
              onInput={updateQuery}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div
            class="currency-select__list"
            id={listId}
            role="listbox"
            aria-label={`${label} currencies`}
          >
            {visible.map((currency, index) => (
              <div
                key={currency.short_code}
                id={`${listId}-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={currency.short_code === value}
                class={`currency-select__option${index === activeIndex ? " currency-select__option--active" : ""}`}
                onPointerDown={keepSearchFocus}
                onPointerMove={() => highlightOption(index)}
                onClick={() => choose(currency.short_code)}
                onKeyDown={(event) => chooseOnKey(event, currency.short_code)}
              >
                <span class="currency-select__option-code">{currency.short_code}</span>
                <span class="currency-select__option-name">{currency.name}</span>
                {currency.short_code === value && <span aria-hidden="true">✓</span>}
              </div>
            ))}
          </div>
          {matches.length === 0 && (
            <output class="currency-select__empty">No currencies found.</output>
          )}
        </div>
      )}
    </div>
  );
}
