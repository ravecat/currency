import type { Meta, StoryObj } from "@storybook/preact-vite";
import { expect } from "storybook/test";
import { App } from "../src/app";

const meta = {
  title: "Hello",
  component: App,
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hello: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: /^Hello$/ })).toBeVisible();
    await expect(canvas.getByRole("main")).toHaveTextContent(/^Hello$/);
  },
};
