"use client";

import { useId, ReactElement, HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { recursiveCloneChildren } from "@/lib/align-ui-utils/recursive-clone-children";

const AVATAR_ROOT_NAME = "AvatarRoot";
const AVATAR_GROUP_ROOT_NAME = "AvatarGroupRoot";
const AVATAR_GROUP_OVERFLOW_NAME = "AvatarGroupOverflow";

export const avatarGroupVariants = tv({
  slots: {
    root: "flex *:ring-1 *:ring-accent-foreground",
    overflow:
      "relative flex shrink-0 items-center justify-center rounded-full bg-primary/90 text-center text-primary-foreground",
  },
  variants: {
    size: {
      "80": {
        root: "-space-x-4",
        overflow: "size-20 text-2xl",
      },
      "72": {
        root: "-space-x-4",
        overflow: "size-[72px] text-2xl",
      },
      "64": {
        root: "-space-x-4",
        overflow: "size-16 text-2xl",
      },
      "56": {
        root: "-space-x-4",
        overflow: "size-14 text-2xl",
      },
      "48": {
        root: "-space-x-3",
        overflow: "size-12 text-xl",
      },
      "40": {
        root: "-space-x-3",
        overflow: "size-10 text-base",
      },
      "32": {
        root: "-space-x-1.5",
        overflow: "size-8 text-sm",
      },
      "24": {
        root: "-space-x-1",
        overflow: "size-6 text-xs",
      },
      "20": {
        root: "-space-x-1",
        overflow:
          "size-5 text-[0.6875rem] leading-[0.75rem] tracking-[-0.015em]",
      },
    },
  },
  defaultVariants: {
    size: "24",
  },
});

type AvatarGroupSharedProps = VariantProps<typeof avatarGroupVariants>;

type AvatarGroupRootProps = VariantProps<typeof avatarGroupVariants> &
  React.HTMLAttributes<HTMLDivElement>;

function AvatarGroupRoot({
  children,
  size,
  className,
  ...rest
}: AvatarGroupRootProps) {
  const uniqueId = useId();
  const { root } = avatarGroupVariants({ size });

  const sharedProps: AvatarGroupSharedProps = {
    size,
  };

  const extendedChildren = recursiveCloneChildren(
    children as ReactElement[],
    sharedProps,
    [AVATAR_ROOT_NAME, AVATAR_GROUP_OVERFLOW_NAME],
    uniqueId
  );

  return (
    <div className={root({ class: className })} {...rest}>
      {extendedChildren}
    </div>
  );
}
AvatarGroupRoot.displayName = AVATAR_GROUP_ROOT_NAME;

function AvatarGroupOverflow({
  children,
  size,
  className,
  ...rest
}: AvatarGroupSharedProps & HTMLAttributes<HTMLDivElement>) {
  const { overflow } = avatarGroupVariants({ size });

  return (
    <div className={overflow({ class: className })} {...rest}>
      {children}
    </div>
  );
}
AvatarGroupOverflow.displayName = AVATAR_GROUP_OVERFLOW_NAME;

export { AvatarGroupRoot, AvatarGroupOverflow };
