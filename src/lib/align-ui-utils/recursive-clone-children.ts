import {
  ReactNode,
  ComponentType,
  isValidElement,
  Children,
  cloneElement,
} from "react";

/**
 * Recursively clones React children, adding additional props to components with matched display names.
 *
 * @param children - The node(s) to be cloned.
 * @param additionalProps - The props to add to the matched components. Use specific types where possible for better safety.
 * @param displayNames - An array of display names to match components against. Note: Relies on components having `displayName` set; brittle in minified builds.
 * @param uniqueId - A unique ID prefix from the parent component to generate stable keys. Must be a non-empty string.
 * @param asChild - Indicates whether the parent component uses a Slot-like pattern (expects single child).
 *
 * @returns The cloned node(s) with the additional props applied to the matched components.
 * @throws Error if asChild is true and multiple children are provided (dev-only).
 */
export function recursiveCloneChildren(
  children: ReactNode,
  additionalProps: Record<string, unknown>,
  displayNames: string[],
  uniqueId: string,
  asChild?: boolean
): ReactNode | ReactNode[] {
  if (typeof uniqueId !== "string" || uniqueId.trim() === "") {
    throw new Error(
      "uniqueId must be a non-empty string for stable key generation."
    );
  }

  if (displayNames.length === 0) {
    return children;
  }

  const mappedChildren = Children.map(children, (child: ReactNode, index) => {
    if (!isValidElement(child)) {
      return child;
    }

    const componentType = child.type as
      | ComponentType
      | { displayName?: string; name?: string };
    const displayName =
      componentType.displayName ||
      (typeof componentType === "function" ? componentType.name : "") ||
      "";

    const shouldAddProps = displayNames.includes(displayName);
    const newProps = shouldAddProps ? additionalProps : {};

    // Type-safe prop access with guards.
    let childChildren: ReactNode = undefined;
    let childAsChild: boolean | undefined = undefined;
    if (typeof child.props === "object" && child.props !== null) {
      childChildren = (child.props as { children?: ReactNode }).children;
      childAsChild = (child.props as { asChild?: boolean }).asChild;
    }

    const recursedChildren = recursiveCloneChildren(
      childChildren,
      additionalProps,
      displayNames,
      uniqueId,
      childAsChild
    );

    if (!shouldAddProps && childChildren === recursedChildren) {
      return child;
    }

    return cloneElement(
      child,
      { ...newProps, key: `${uniqueId}-${index}` },
      recursedChildren
    );
  });

  if (asChild) {
    if (mappedChildren && mappedChildren.length > 1) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error("asChild expects a single child; multiple provided.");
      }

      console.warn("asChild expects a single child; using first.");
    }
    return mappedChildren?.[0] ?? null;
  }

  return mappedChildren;
}
