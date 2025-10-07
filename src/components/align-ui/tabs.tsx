"use client";

import {
  ComponentPropsWithoutRef,
  ComponentRef,
  ElementType,
  forwardRef,
  HTMLAttributes,
  useRef,
  useState,
} from "react";
import { Slottable } from "@radix-ui/react-slot";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import mergeRefs from "merge-refs";
import { useTabObserver } from "./hooks/use-tab-observer";
import { PolymorphicComponentProps } from "@/lib/align-ui-utils/polymorphic";
import { cn } from "@/lib/utils";

const TabMenuHorizontalContent = TabsPrimitive.Content;
TabMenuHorizontalContent.displayName = "TabMenuHorizontalContent";

const TabMenuHorizontalRoot = forwardRef<
  ComponentRef<typeof TabsPrimitive.Root>,
  Omit<ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "orientation">
>(({ className, ...rest }, forwardedRef) => {
  return (
    <TabsPrimitive.Root
      ref={forwardedRef}
      orientation="horizontal"
      className={cn("w-full", className)}
      {...rest}
    />
  );
});
TabMenuHorizontalRoot.displayName = "TabMenuHorizontalRoot";

const TabMenuHorizontalList = forwardRef<
  ComponentRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    wrapperClassName?: string;
  }
>(({ children, className, wrapperClassName, ...rest }, forwardedRef) => {
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });
  const listWrapperRef = useRef<HTMLDivElement>(null);

  const { mounted, listRef } = useTabObserver({
    onActiveTabChange: (_, activeTab) => {
      const { offsetWidth: width, offsetLeft: left } = activeTab;
      setLineStyle({ width, left });

      const listWrapper = listWrapperRef.current;
      if (listWrapper) {
        const containerWidth = listWrapper.clientWidth;
        const scrollPosition = left - containerWidth / 2 + width / 2;

        listWrapper.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    },
  });

  return (
    <div
      ref={listWrapperRef}
      className={cn(
        "relative grid overflow-x-auto overflow-y-hidden overscroll-contain",
        wrapperClassName
      )}
    >
      <TabsPrimitive.List
        ref={mergeRefs(forwardedRef, listRef)}
        className={cn(
          "group/tab-list relative flex h-12 items-center gap-6 whitespace-nowrap border-b",
          className
        )}
        {...rest}
      >
        <Slottable>{children}</Slottable>

        {/* Floating Bg */}
        <div
          className={cn(
            "absolute -bottom-px left-0 h-0.5 bg-primary opacity-0 transition-all duration-300 group-has-[[data-state=active]]/tab-list:opacity-100",
            {
              hidden: !mounted,
            }
          )}
          style={{
            transform: `translate3d(${lineStyle.left}px, 0, 0)`,
            width: `${lineStyle.width}px`,
            transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
          }}
          aria-hidden="true"
        />
      </TabsPrimitive.List>
    </div>
  );
});
TabMenuHorizontalList.displayName = "TabMenuHorizontalList";

const TabMenuHorizontalTrigger = forwardRef<
  ComponentRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...rest }, forwardedRef) => {
  return (
    <TabsPrimitive.Trigger
      ref={forwardedRef}
      className={cn(
        // base
        "group/tab-item h-12 py-3.5 text-sm text-muted-foreground outline-none",
        "flex items-center justify-center gap-1.5",
        "transition duration-200 ease-out",
        // focus
        "focus:outline-none",
        // active
        "data-[state=active]:text-primary",
        className
      )}
      {...rest}
    />
  );
});
TabMenuHorizontalTrigger.displayName = "TabMenuHorizontalTrigger";

function TabMenuHorizontalIcon<T extends ElementType>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || "div";

  return (
    <Component
      className={cn(
        // base
        "size-5 text-muted-foreground",
        "transition duration-200 ease-out",
        // active
        "group-data-[state=active]/tab-item:text-primary",
        className
      )}
      {...rest}
    />
  );
}
TabMenuHorizontalIcon.displayName = "TabsHorizontalIcon";

function TabMenuHorizontalArrowIcon<T extends ElementType>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T, HTMLAttributes<HTMLDivElement>>) {
  const Component = as || "div";

  return (
    <Component
      className={cn("size-5 text-muted-foreground", className)}
      {...rest}
    />
  );
}
TabMenuHorizontalArrowIcon.displayName = "TabsHorizontalArrow";

export {
  TabMenuHorizontalRoot,
  TabMenuHorizontalList,
  TabMenuHorizontalTrigger,
  TabMenuHorizontalIcon,
  TabMenuHorizontalArrowIcon,
  TabMenuHorizontalContent,
};
