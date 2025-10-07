import {
  useId,
  ReactElement,
  HTMLAttributes,
  forwardRef,
  ImgHTMLAttributes,
} from "react";
import { Slot } from "@radix-ui/react-slot";

import { IconEmptyCompany, IconEmptyUser } from "./avatar-empty-icons";

import { tv, type VariantProps } from "tailwind-variants";
import { recursiveCloneChildren } from "@/lib/align-ui-utils/recursive-clone-children";
import { cn } from "@/lib/utils";

export const AVATAR_ROOT_NAME = "AvatarRoot";
const AVATAR_IMAGE_NAME = "AvatarImage";
const AVATAR_INDICATOR_NAME = "AvatarIndicator";
const AVATAR_STATUS_NAME = "AvatarStatus";
const AVATAR_BRAND_LOGO_NAME = "AvatarBrandLogo";
const AVATAR_NOTIFICATION_NAME = "AvatarNotification";

export const avatarVariants = tv({
  slots: {
    root: [
      "relative flex shrink-0 items-center justify-center rounded-full",
      "select-none text-center uppercase",
    ],
    image: "size-full rounded-full object-cover",
    indicator:
      "absolute flex size-8 items-center justify-center drop-shadow-[0_2px_4px_rgba(27, 28, 29, 0.04)]",
  },
  variants: {
    size: {
      "80": {
        root: "size-20 text-2xl",
      },
      "72": {
        root: "size-[72px] text-2xl",
      },
      "64": {
        root: "size-16 text-2xl",
      },
      "56": {
        root: "size-14 text-lg",
      },
      "48": {
        root: "size-12 text-lg",
      },
      "40": {
        root: "size-10 text-md",
      },
      "32": {
        root: "size-8 text-sm",
      },
      "24": {
        root: "size-6 text-xs",
      },
      "20": {
        root: "size-5 text-xs",
      },
    },
    color: {
      gray: {
        root: "bg-gray-200 dark:bg-gray-700 text-black",
      },
      yellow: {
        root: "bg-yellow-200 text-yellow-950",
      },
      blue: {
        root: "bg-blue-200 text-blue-950",
      },
      sky: {
        root: "bg-sky-200 text-sky-950",
      },
      purple: {
        root: "bg-purple-200 text-purple-950",
      },
      red: {
        root: "bg-red-200 text-red-950",
      },
    },
  },
  compoundVariants: [
    {
      size: ["80", "72"],
      class: {
        indicator: "-right-2",
      },
    },
    {
      size: "64",
      class: {
        indicator: "-right-2 scale-[.875]",
      },
    },
    {
      size: "56",
      class: {
        indicator: "-right-1.5 scale-75",
      },
    },
    {
      size: "48",
      class: {
        indicator: "-right-1.5 scale-[.625]",
      },
    },
    {
      size: "40",
      class: {
        indicator: "-right-1.5 scale-[.5625]",
      },
    },
    {
      size: "32",
      class: {
        indicator: "-right-1.5 scale-50",
      },
    },
    {
      size: "24",
      class: {
        indicator: "-right-1 scale-[.375]",
      },
    },
    {
      size: "20",
      class: {
        indicator: "-right-1 scale-[.3125]",
      },
    },
  ],
  defaultVariants: {
    size: "24",
    color: "gray",
  },
});

type AvatarSharedProps = VariantProps<typeof avatarVariants>;

export type AvatarRootProps = VariantProps<typeof avatarVariants> &
  HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
    placeholderType?: "user" | "company";
  };

const AvatarRoot = forwardRef<HTMLDivElement, AvatarRootProps>(
  (
    {
      asChild,
      children,
      size,
      color,
      className,
      placeholderType = "user",
      ...rest
    },
    forwardedRef
  ) => {
    const uniqueId = useId();
    const Component = asChild ? Slot : "div";
    const { root } = avatarVariants({ size, color });

    const sharedProps: AvatarSharedProps = {
      size,
      color,
    };

    // use placeholder icon if no children provided
    if (!children) {
      return (
        <div className={root({ class: className })} {...rest}>
          <AvatarImage asChild>
            {placeholderType === "company" ? (
              <IconEmptyCompany />
            ) : (
              <IconEmptyUser />
            )}
          </AvatarImage>
        </div>
      );
    }

    const extendedChildren = recursiveCloneChildren(
      children as ReactElement[],
      sharedProps,
      [AVATAR_IMAGE_NAME, AVATAR_INDICATOR_NAME],
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
AvatarRoot.displayName = AVATAR_ROOT_NAME;

type AvatarImageProps = AvatarSharedProps &
  Omit<ImgHTMLAttributes<HTMLImageElement>, "color"> & {
    asChild?: boolean;
  };

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ asChild, className, size, color, ...rest }, forwardedRef) => {
    const Component = asChild ? Slot : "img";
    const { image } = avatarVariants({ size, color });

    return (
      <Component
        ref={forwardedRef}
        className={image({ class: className })}
        {...rest}
      />
    );
  }
);
AvatarImage.displayName = AVATAR_IMAGE_NAME;

function AvatarIndicator({
  size,
  color,
  className,
  position = "bottom",
  ...rest
}: AvatarSharedProps &
  HTMLAttributes<HTMLDivElement> & {
    position?: "top" | "bottom";
  }) {
  const { indicator } = avatarVariants({ size, color });

  return (
    <div
      className={cn(indicator({ class: className }), {
        "top-0 origin-top-right": position === "top",
        "bottom-0 origin-bottom-right": position === "bottom",
      })}
      {...rest}
    />
  );
}
AvatarIndicator.displayName = AVATAR_INDICATOR_NAME;

export const avatarStatusVariants = tv({
  base: "box-content size-3 rounded-full border-4 border-bg-white-0",
  variants: {
    status: {
      online: "bg-success-base",
      offline: "bg-faded-base",
      busy: "bg-error-base",
      away: "bg-away-base",
    },
  },
  defaultVariants: {
    status: "online",
  },
});

function AvatarStatus({
  status,
  className,
  ...rest
}: VariantProps<typeof avatarStatusVariants> & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={avatarStatusVariants({ status, class: className })}
      {...rest}
    />
  );
}
AvatarStatus.displayName = AVATAR_STATUS_NAME;

type AvatarBrandLogoProps = ImgHTMLAttributes<HTMLImageElement> & {
  asChild?: boolean;
};

const AvatarBrandLogo = forwardRef<HTMLImageElement, AvatarBrandLogoProps>(
  ({ asChild, className, ...rest }, forwardedRef) => {
    const Component = asChild ? Slot : "img";

    return (
      <Component
        ref={forwardedRef}
        className={cn(
          "box-content size-6 rounded-full border-2 border-bg-white-0",
          className
        )}
        {...rest}
      />
    );
  }
);
AvatarBrandLogo.displayName = AVATAR_BRAND_LOGO_NAME;

function AvatarNotification({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "box-content size-3 rounded-full border-2 border-bg-white-0 bg-error-base",
        className
      )}
      {...rest}
    />
  );
}
AvatarNotification.displayName = AVATAR_NOTIFICATION_NAME;

export {
  AvatarRoot,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
  AvatarBrandLogo,
  AvatarNotification,
};
