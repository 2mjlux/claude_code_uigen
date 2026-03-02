import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getLabel, ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// getLabel pure function tests
test("getLabel: str_replace_editor create", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getLabel: str_replace_editor str_replace", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "/Card.jsx" })).toBe("Editing /Card.jsx");
});

test("getLabel: str_replace_editor insert", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "/index.ts" })).toBe("Editing /index.ts");
});

test("getLabel: str_replace_editor view", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "/utils.ts" })).toBe("Reading /utils.ts");
});

test("getLabel: str_replace_editor undo_edit", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Reverting /App.jsx");
});

test("getLabel: file_manager rename", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming /old.jsx");
});

test("getLabel: file_manager delete", () => {
  expect(getLabel("file_manager", { command: "delete", path: "/dead.jsx" })).toBe("Deleting /dead.jsx");
});

test("getLabel: unknown tool returns toolName", () => {
  expect(getLabel("unknown_tool", { command: "create", path: "/App.jsx" })).toBe("unknown_tool");
});

test("getLabel: unknown command on known tool returns toolName", () => {
  expect(getLabel("str_replace_editor", { command: "unknown_cmd", path: "/App.jsx" })).toBe("str_replace_editor");
});

// ToolCallBadge component render tests
test("ToolCallBadge pending state shows spinner and label", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  };

  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  // Spinner SVG should be present
  expect(container.querySelector("svg")).toBeDefined();
  // No green dot
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge result state shows green dot and label", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Success",
  };

  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge partial-call state shows spinner, no green dot", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "partial-call",
  };

  const { container } = render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(container.querySelector("svg")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge file_manager rename shows correct label", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx" },
    state: "call",
  };

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming /old.jsx")).toBeDefined();
});

test("ToolCallBadge unknown tool shows fallback toolName", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "unknown_tool",
    args: {},
    state: "call",
  };

  render(<ToolCallBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("unknown_tool")).toBeDefined();
});
