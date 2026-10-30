import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { presets } from "./.storybook/matrix.ts";

const browserSize = {
  width: Math.max(...Object.values(presets).map(({ width }) => width)),
  height: Math.max(...Object.values(presets).map(({ height }) => height)),
};

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        optimizeDeps: { include: ["@storybook/addon-a11y/preview", "@storybook/preact-vite"] },
        plugins: [
          storybookTest({ configDir: fileURLToPath(new URL("./.storybook", import.meta.url)) }),
        ],
        test: {
          name: "storybook",
          setupFiles: ["./.storybook/vitest.setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: true,
            provider: playwright({
              contextOptions: { viewport: browserSize, screen: browserSize },
            }),
            instances: Object.entries(presets).map(([id, { width, height }]) => ({
              browser: "chromium",
              name: `storybook-${id}`,
              viewport: { width, height },
              provide: { viewport: { value: id, isRotated: false } },
              screenshotDirectory: `.vitest-attachments/failures/${id}`,
            })),
            expect: {
              toMatchScreenshot: {
                resolveScreenshotPath: ({
                  project,
                  root,
                  testFileDirectory,
                  testFileName,
                  browserName,
                  platform,
                  arg,
                  ext,
                }) =>
                  path.join(
                    root,
                    testFileDirectory,
                    "__screenshots__",
                    testFileName,
                    project.name,
                    `${arg}-${browserName}-${platform}${ext}`,
                  ),
                resolveDiffPath: ({
                  project,
                  root,
                  attachmentsDir,
                  testFileDirectory,
                  testFileName,
                  browserName,
                  platform,
                  arg,
                  ext,
                }) =>
                  path.join(
                    root,
                    attachmentsDir,
                    testFileDirectory,
                    testFileName,
                    project.name,
                    `${arg}-${browserName}-${platform}${ext}`,
                  ),
              },
            },
          },
        },
      },
    ],
  },
});
