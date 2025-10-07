"use client";

import {
  forwardRef,
  useId,
  HTMLAttributes,
  ButtonHTMLAttributes,
  ReactElement,
  ElementType,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";

import { PolymorphicComponentProps } from "@/lib/align-ui-utils/polymorphic";
import { recursiveCloneChildren } from "@/lib/align-ui-utils/recursive-clone-children";

const BUTTON_GROUP_ROOT_NAME = "ButtonGroupRoot";
const BUTTON_GROUP_ITEM_NAME = "ButtonGroupItem";
const BUTTON_GROUP_ICON_NAME = "ButtonGroupIcon";

export const buttonGroupVariants = tv({
  slots: {
    root: "flex -space-x-[1.5px]",
    item: [
      // base
      "group relative inline-flex items-center justify-center whitespace-nowrap bg-background shadow-xs text-center outline-none",
      "border",
      "transition duration-200 ease-out",
      // hover
      "hover:bg-accent hover:text-accent-foreground",
      // focus
      "focus:bg-primary/90 focus:outline-none",
      // active
      "data-[state=on]:bg-primary/90",
      // disabled
      "disabled:pointer-events-none disabled:opacity-50",
    ],
    icon: "shrink-0",
  },
  variants: {
    size: {
      small: {
        item: [
          // base
          "h-9 gap-4 px-4 text-label-sm",
          // radius
          "first:rounded-l-lg last:rounded-r-lg",
        ],
        icon: [
          // base
          "-mx-2 size-5",
        ],
      },
      xsmall: {
        item: [
          // base
          "h-8 gap-3.5 px-3.5 text-label-sm",
          // radius
          "first:rounded-l-lg last:rounded-r-lg",
        ],
        icon: [
          // base
          "-mx-2 size-5",
        ],
      },
      xxsmall: {
        item: [
          // base
          "h-6 gap-3 px-3 text-label-xs",
          // radius
          "first:rounded-l-md last:rounded-r-md",
        ],
        icon: [
          // base
          "-mx-2 size-4",
        ],
      },
    },
  },
  defaultVariants: {
    size: "small",
  },
});

type ButtonGroupSharedProps = VariantProps<typeof buttonGroupVariants>;

type ButtonGroupRootProps = VariantProps<typeof buttonGroupVariants> &
  HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  };

const ButtonGroupRoot = forwardRef<HTMLDivElement, ButtonGroupRootProps>(
  ({ asChild, children, className, size, ...rest }, forwardedRef) => {
    const uniqueId = useId();
    const Component = asChild ? Slot : "div";
    const { root } = buttonGroupVariants({ size });

    const sharedProps: ButtonGroupSharedProps = {
      size,
    };

    const extendedChildren = recursiveCloneChildren(
      children as ReactElement[],
      sharedProps,
      [BUTTON_GROUP_ITEM_NAME, BUTTON_GROUP_ICON_NAME],
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
ButtonGroupRoot.displayName = BUTTON_GROUP_ROOT_NAME;

type ButtonGroupItemProps = ButtonGroupSharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const ButtonGroupItem = forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ children, className, size, asChild, ...rest }, forwardedRef) => {
    const Component = asChild ? Slot : "button";
    const { item } = buttonGroupVariants({ size });

    return (
      <Component
        ref={forwardedRef}
        className={item({ class: className })}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);
ButtonGroupItem.displayName = BUTTON_GROUP_ITEM_NAME;

function ButtonGroupIcon<T extends ElementType>({
  className,
  size,
  as,
  ...rest
}: PolymorphicComponentProps<T, ButtonGroupSharedProps>) {
  const Component = as || "div";
  const { icon } = buttonGroupVariants({ size });

  return <Component className={icon({ class: className })} {...rest} />;
}
ButtonGroupIcon.displayName = BUTTON_GROUP_ICON_NAME;

export { ButtonGroupRoot, ButtonGroupItem, ButtonGroupIcon };
