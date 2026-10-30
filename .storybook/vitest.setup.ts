import * as a11yAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/preact-vite";
import { afterEach, expect, inject } from "vitest";
import type {} from "vitest/browser";
import type { presets } from "./matrix";
import * as previewAnnotations from "./preview";

declare module "vitest" {
  interface ProvidedContext {
    viewport: { value: keyof typeof presets; isRotated: false };
  }
}

setProjectAnnotations([
  a11yAnnotations,
  previewAnnotations,
  { initialGlobals: { viewport: inject("viewport") } },
]);

afterEach(async () => {
  await document.fonts.ready;
  // oxlint-disable-next-line vitest/no-standalone-expect -- Capture each story after its play function.
  await expect(document.documentElement).toMatchScreenshot({ timeout: 15_000 });
});
