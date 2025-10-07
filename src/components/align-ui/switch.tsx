"use client";

import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = forwardRef<
  ComponentRef<typeof SwitchPrimitives.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, disabled, ...rest }, forwardedRef) => {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "group/switch block h-5 w-8 shrink-0 p-0.5 outline-none focus:outline-none",
        className
      )}
      ref={forwardedRef}
      disabled={disabled}
      {...rest}
    >
      <div
        className={cn(
          // base
          "h-4 w-7 rounded-full bg-input p-0.5 outline-none",
          "transition duration-200 ease-out",
          // unchecked
          !disabled && [
            // hover
            "group-hover/switch:bg-gray-300 dark:group-hover/switch:bg-gray-600",
            // focus
            "group-focus-visible/switch:bg-gray-300 dark:group-focus-visible/switch:bg-gray-600",
            // pressed
            "group-active/switch:bg-gray-200 dark:group-active/switch:bg-gray-700",
            // checked
            "group-data-[state=checked]/switch:bg-primary",
            // checked hover
            "group-hover:data-[state=checked]/switch:bg-primary",
            // checked pressed
            "group-active:data-[state=checked]/switch:bg-primary",
            // focus
            "group-focus/switch:outline-none",
          ],
          // disabled
          disabled && ["p-[3px] ring ring-inset ring-input opacity-50"]
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            // base
            "pointer-events-none relative block size-3",
            "transition-transform duration-200 ease-out",
            // checked
            "data-[state=checked]:translate-x-3",
            !disabled && [
              // before
              "before:absolute before:inset-y-0 before:left-1/2 before:w-3 before:-translate-x-1/2 before:rounded-full before:bg-primary-foreground",
              "before:[mask-image:radial-gradient(circle_farthest-side_at_50%_50%,transparent_1.95px,black_2.05px_100%)]",
              "before:[mask-size:100%_100%] before:[mask-repeat:no-repeat] before:[mask-position:50%_50%]",
              // after
              "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2 after:rounded-full after:shadow-[0_6px_10px_0_rgba(14,18,27,0.06),0_2px_4px_0_rgba(14,18,27,0.08)]",
              // pressed
              "group-active/switch:scale-[.833]",
            ],
            // disabled
            disabled && ["size-2.5 rounded-full bg-input shadow-none"]
          )}
        />
      </div>
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
