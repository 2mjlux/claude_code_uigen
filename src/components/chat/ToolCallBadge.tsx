"use client";

import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const path = (args.path as string | undefined) ?? "";
    switch (command) {
      case "create":      return `Creating ${path}`;
      case "str_replace": return `Editing ${path}`;
      case "insert":      return `Editing ${path}`;
      case "view":        return `Reading ${path}`;
      case "undo_edit":   return `Reverting ${path}`;
    }
  }
  if (toolName === "file_manager") {
    const command = args.command as string | undefined;
    const path = (args.path as string | undefined) ?? "";
    switch (command) {
      case "rename": return `Renaming ${path}`;
      case "delete": return `Deleting ${path}`;
    }
  }
  return toolName;
}

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  const label = getLabel(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown>
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {toolInvocation.state === "result" && toolInvocation.result ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
