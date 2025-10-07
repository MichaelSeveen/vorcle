"use client";

import { CSSProperties } from "react";
import { useDragLayer } from "react-dnd";
import { Event } from "../config/types";

export const ItemTypes = {
  EVENT: "event",
} as const;

interface DragItem {
  event: Event;
  children: React.ReactNode;
  width: number;
  height: number;
}

interface XYCoord {
  x: number;
  y: number;
}

interface ItemStyleProps {
  currentOffset: XYCoord;
  initialOffset: XYCoord;
  initialClientOffset: XYCoord;
}

function getItemStyles({
  currentOffset,
  initialOffset,
  initialClientOffset,
}: ItemStyleProps): CSSProperties {
  const offsetX = initialClientOffset.x - initialOffset.x;
  const offsetY = initialClientOffset.y - initialOffset.y;

  const layerStyles: CSSProperties = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 100,
    left: currentOffset.x - offsetX,
    top: currentOffset.y - offsetY,
  };

  return layerStyles;
}

export default function CustomDragLayer() {
  const {
    itemType,
    isDragging,
    item,
    currentOffset,
    initialOffset,
    initialClientOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem() as DragItem | null,
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    initialOffset: monitor.getInitialClientOffset(),
    initialClientOffset: monitor.getInitialClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (
    !isDragging ||
    !item ||
    !currentOffset ||
    !initialOffset ||
    !initialClientOffset ||
    itemType !== ItemTypes.EVENT
  ) {
    return null;
  }

  return (
    <div
      style={getItemStyles({
        currentOffset,
        initialOffset,
        initialClientOffset,
      })}
    >
      <div style={{ width: item.width, height: item.height }}>
        {item.children}
      </div>
    </div>
  );
}
