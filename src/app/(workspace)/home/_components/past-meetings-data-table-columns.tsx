import Link from "next/link";
import { format } from "date-fns";
import AttendeesAvatarGroup from "./attendees-avatar-group";
import { MeetingTableItems } from "@/config/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Ellipsis, EyeIcon, Text } from "lucide-react";
import { CalendarIcon } from "@/components/custom-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function getPastMeetingsColumns(): ColumnDef<MeetingTableItems>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    },
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <p className="max-w-[10rem] w-full font-medium truncate">
          {row.getValue("title")}
        </p>
      ),
      meta: {
        label: "Title",
        placeholder: "Search titles...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <p className="w-full max-w-[10rem] truncate">
          {row.getValue("description") ?? "N/A"}
        </p>
      ),
    },
    {
      id: "startTime",
      accessorKey: "startTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Time" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("startTime"));
        const meetingStartTime = format(date, "PPp");

        return (
          <span className="max-w-[10rem]">{meetingStartTime ?? "N/A"}</span>
        );
      },
    },
    {
      id: "endTime",
      accessorKey: "endTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Time" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("endTime"));
        const meetingEndTime = format(date, "pp");

        return <span className="max-w-[10rem]">{meetingEndTime ?? "N/A"}</span>;
      },
    },
    {
      id: "attendees",
      accessorKey: "attendees",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attended By" />
      ),
      cell: ({ row }) => {
        const attendees = row.getValue("attendees");

        return (
          <div className="max-w-[10rem]">
            {attendees === null ? (
              "N/A"
            ) : (
              <AttendeesAvatarGroup attendees={attendees} />
            )}
          </div>
        );
      },
    },
    {
      id: "processed",
      accessorKey: "processed",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processed" />
      ),
      cell: ({ cell }) => {
        const rowValue = cell.getValue<MeetingTableItems["processed"]>();

        return (
          <span className="max-w-[5rem]">
            {rowValue === true ? "TRUE" : "FALSE"}
          </span>
        );
      },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ cell }) => {
        const date = new Date(cell.getValue<MeetingTableItems["createdAt"]>());
        const createdAt = format(date, "do MMM yyyy");

        return <span className="max-w-[10rem]">{createdAt ?? "N/A"}</span>;
      },
      meta: {
        label: "Created At",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem asChild>
                <Link
                  href={`/meeting/${row.original.id}`}
                  className="inline-flex items-center gap-2 w-full"
                >
                  <EyeIcon />
                  View
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 32,
    },
  ];
}
