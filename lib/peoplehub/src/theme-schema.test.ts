import assert from "node:assert/strict";
import { test } from "node:test";
import { themeContentSchema } from "./theme-schema";

const baseTheme = {
  preset: "aurora",
  defaultMode: "dark",
  allowModeToggle: true,
  customColors: false,
  primary: "#8b5cf6",
  cyan: "#22d3ee",
  pink: "#ec4899",
  background: "#090b13",
};

test("appearance theme accepts all website width options", () => {
  for (const containerLayout of ["standard", "wide", "fluid", "custom"]) {
    assert(themeContentSchema.safeParse({ ...baseTheme, containerLayout, customContainerWidth: 1440 }).success);
  }
});

test("custom website width is bounded and integral", () => {
  assert(themeContentSchema.safeParse({ ...baseTheme, containerLayout: "custom", customContainerWidth: 1080 }).success);
  assert(themeContentSchema.safeParse({ ...baseTheme, containerLayout: "custom", customContainerWidth: 1920 }).success);
  for (const customContainerWidth of [1079, 1921, 1440.5, "1440"]) {
    assert(!themeContentSchema.safeParse({ ...baseTheme, containerLayout: "custom", customContainerWidth }).success);
  }
});

test("appearance theme rejects unknown settings", () => {
  assert(!themeContentSchema.safeParse({ ...baseTheme, unexpected: true }).success);
});
