import type { StorybookConfig } from "@storybook/preact-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/preact-vite",
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  features: { sidebarOnboardingChecklist: false },
};

export default config;
