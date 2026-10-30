import type { Preview } from "@storybook/preact-vite";
import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
  },
};

export default preview;
