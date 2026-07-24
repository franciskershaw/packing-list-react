import { describe, expect, it } from "vitest";

import { getInitials } from "./Avatar";

describe("getInitials", () => {
  it.each([
    ["Sam Rivera", "SR"],
    ["sam rivera", "SR"],
    ["Sam", "S"],
    ["  Sam   Rivera  ", "SR"],
    ["Sam Miguel Rivera", "SR"],
    ["", ""],
  ] as const)("(%s) -> %s", (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });
});
