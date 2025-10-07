"use client";

import { useMemo } from "react";
import type { Meeting } from "@prisma/client";
import { MeetingTableItems } from "@/config/types";
import { getPastMeetingsColumns } from "./past-meetings-data-table-columns";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
interface PastMeetingsTableProps {
  data: Meeting[];
  pageCount: number;
}

export default function PastMeetingsTable({
  data,
  pageCount,
}: PastMeetingsTableProps) {
  const columns = useMemo(() => getPastMeetingsColumns(), []);

  const { table } = useDataTable<MeetingTableItems>({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </>
  );
}
