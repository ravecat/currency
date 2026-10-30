import type { Preview } from "@storybook/preact-vite";
import { presets } from "./matrix";
import "../src/index.css";

const preview: Preview = {
  initialGlobals: { viewport: { value: "XL-landscape", isRotated: false } },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    viewport: {
      options: Object.fromEntries(
        Object.entries(presets).map(([id, { size, orientation, width, height }]) => [
          id,
          {
            name: `${size} / ${orientation}`,
            styles: { width: `${width}px`, height: `${height}px` },
          },
        ]),
      ),
    },
  },
};

export default preview;
