"use client"

import { ColumnDef } from "@tanstack/react-table"
import { FileEntry } from "../types"
import { Button } from "../../../../components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DatePickerWithInput } from "./DatePickerWithInput"
import { EditableCell } from "./EditableCell"
import { TagsCell } from "./TagsCell"

interface GetColumnsProps {
    onDateChange: (entry: FileEntry, date: Date) => void;
    onSuffixChange: (entry: FileEntry, newSuffix: string) => void;
    onTagsChange: (entry: FileEntry, newTags: string[]) => void;
}

export const getColumns = ({ onDateChange, onSuffixChange, onTagsChange }: GetColumnsProps): ColumnDef<FileEntry>[] => [
  {
    accessorKey: "oldName",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Original Filename
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
  },
  {
    accessorKey: "newName",
    header: "New Filename",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
        <TagsCell row={row} onTagsChange={onTagsChange} />
    )
  },
  {
    accessorKey: "suffix",
    header: "Suffix",
    cell: ({ row }) => (
        <EditableCell row={row} onSuffixChange={onSuffixChange} />
    )
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
        <DatePickerWithInput row={row} onDateChange={onDateChange} />
    ),
    size: 120,
  },
]
