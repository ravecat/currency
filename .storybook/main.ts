import type { StorybookConfig } from "@storybook/preact-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/preact-vite",
  viteFinal: (config) => ({
    ...config,
    define: {
      ...config.define,
      "import.meta.env.VITE_CURRENCYBEACON_API_KEY": JSON.stringify("storybook-key"),
    },
  }),
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: { sidebarOnboardingChecklist: false },
};

export default config;
