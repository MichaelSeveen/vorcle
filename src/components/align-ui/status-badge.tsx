"use client";

import type React from "react";

import {
  useId,
  type ReactElement,
  type HTMLAttributes,
  type ElementType,
  forwardRef,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";
import { recursiveCloneChildren } from "@/lib/align-ui-utils/recursive-clone-children";
import type { PolymorphicComponentProps } from "@/lib/align-ui-utils/polymorphic";

const STATUS_BADGE_ROOT_NAME = "StatusBadgeRoot";
const STATUS_BADGE_ICON_NAME = "StatusBadgeIcon";
const STATUS_BADGE_DOT_NAME = "StatusBadgeDot";

export const statusBadgeVariants = tv({
  slots: {
    root: [
      "inline-flex h-6 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 text-xs",
      "has-[>.dot]:gap-1.5",
    ],
    icon: "-mx-1 size-4",
    dot: [
      // base
      "dot -mx-1 flex size-4 items-center justify-center",
      // before
      "before:content-[''] before:size-1.5 before:rounded-full before:bg-current",
    ],
  },
  variants: {
    variant: {
      stroke: {
        root: "bg-gray-50 text-gray-600 ring ring-inset ring-gray-500/10",
      },
      light: {},
    },
    status: {
      completed: {
        icon: "text-green-600",
        dot: "text-green-600",
      },
      pending: {
        icon: "text-amber-600",
        dot: "text-amber-600",
      },
      failed: {
        icon: "text-red-600",
        dot: "text-red-600",
      },
      disabled: {
        icon: "text-gray-600",
        dot: "text-gray-600",
      },
    },
  },
  compoundVariants: [
    {
      variant: "light",
      status: "completed",
      class: {
        root: "bg-green-50 text-green-600",
      },
    },
    {
      variant: "light",
      status: "pending",
      class: {
        root: "bg-amber-50 text-amber-600",
      },
    },
    {
      variant: "light",
      status: "failed",
      class: {
        root: "bg-red-50 text-red-600",
      },
    },
    {
      variant: "light",
      status: "disabled",
      class: {
        root: "bg-gray-50 text-gray-600",
      },
    },
  ],
  defaultVariants: {
    status: "disabled",
    variant: "stroke",
  },
});

type StatusBadgeSharedProps = VariantProps<typeof statusBadgeVariants>;

type StatusBadgeRootProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof statusBadgeVariants> & {
    asChild?: boolean;
  };

const StatusBadgeRoot = forwardRef<HTMLDivElement, StatusBadgeRootProps>(
  (
    { asChild, children, variant, status, className, ...rest },
    forwardedRef
  ) => {
    const uniqueId = useId();
    const Component = asChild ? Slot : "div";
    const { root } = statusBadgeVariants({ variant, status });

    const sharedProps: StatusBadgeSharedProps = {
      variant,
      status,
    };

    const extendedChildren = recursiveCloneChildren(
      children as ReactElement[],
      sharedProps,
      [STATUS_BADGE_ICON_NAME, STATUS_BADGE_DOT_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={root({ class: className })}
        {...rest}
      >
        {extendedChildren}
      </Component>
    );
  }
);
StatusBadgeRoot.displayName = STATUS_BADGE_ROOT_NAME;

function StatusBadgeIcon<T extends ElementType = "div">({
  variant,
  status,
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T, StatusBadgeSharedProps>) {
  const Component = as || "div";
  const { icon } = statusBadgeVariants({ variant, status });

  return <Component className={icon({ class: className })} {...rest} />;
}
StatusBadgeIcon.displayName = STATUS_BADGE_ICON_NAME;

function StatusBadgeDot({
  variant,
  status,
  className,
  ...rest
}: StatusBadgeSharedProps & HTMLAttributes<HTMLDivElement>) {
  const { dot } = statusBadgeVariants({ variant, status });

  return <div className={dot({ class: className })} {...rest} />;
}
StatusBadgeDot.displayName = STATUS_BADGE_DOT_NAME;

export { StatusBadgeRoot, StatusBadgeIcon, StatusBadgeDot };
