"use client";

import { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CustomDragLayer from "./custom-drag-layer";

interface ReactDndProviderProps {
  children: ReactNode;
}

export default function ReactDndProvider({ children }: ReactDndProviderProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
      <CustomDragLayer />
    </DndProvider>
  );
}
