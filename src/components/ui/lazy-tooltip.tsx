"use client";

import {
  useState,
  isValidElement,
  cloneElement,
  ReactNode,
  ReactElement,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LazyTooltip({
  children,
  content,
  asChild = true,
}: {
  children: ReactNode;
  content: ReactNode;
  asChild?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  const triggerProps = {
    onPointerEnter: () => setEnabled(true),
    onTouchStart: () => setEnabled(true),
  } as const;

  const withTriggers = (node: ReactNode): ReactNode =>
    isValidElement(node)
      ? cloneElement(node as ReactElement, triggerProps)
      : node;

  if (!enabled) {
    return <>{withTriggers(children)}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>
        {withTriggers(children)}
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
