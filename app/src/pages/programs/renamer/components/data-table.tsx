"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
  ColumnSizingState,
} from "@tanstack/react-table"
import { useVirtualizer } from '@tanstack/react-virtual'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { FileEntry } from "../types"

interface DataTableProps<TData extends FileEntry, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onSelectionChange: (row: TData, ctrlKey: boolean, shiftKey: boolean) => void;
  selectedRows: TData[];
  columnSizes: Record<string, number>
  onColumnResize: (newSizes: Record<string, number>) => void;
  onFilter: (filter: string) => void;
}

export function DataTable<TData extends FileEntry, TValue>({
  columns,
  data,
  onSelectionChange,
  selectedRows,
  columnSizes,
  onColumnResize,
  onFilter,
}: DataTableProps<TData, TValue>) {
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(columnSizes);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    getRowId: (row) => row.id,
  })

  React.useEffect(() => {
    onColumnResize(columnSizing);
  }, [columnSizing, onColumnResize]);

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => {
    let target = e.target as HTMLElement;
  
    while (target && target !== e.currentTarget) {
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'TEXTAREA' ||
        target.dataset.interactive === 'true' ||
        target.closest('button')
      ) {
        return;
      }
      target = target.parentElement as HTMLElement;
    }
  
    onSelectionChange(row.original, e.ctrlKey, e.shiftKey);
  };

  const { rows } = table.getRowModel()
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 28,
    overscan: 10,
  })

  const selectedRowIds = React.useMemo(() => {
    const set = new Set<string>();
    selectedRows.forEach(row => set.add(row.id));
    return set;
  }, [selectedRows]);

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center py-2">
        <Input
          placeholder="Filter files..."
          onChange={(event) => onFilter(event.target.value)}
          className="max-w-sm h-8"
        />
      </div>
      <div className="rounded-md border flex-grow overflow-auto" ref={tableContainerRef}>
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`resizer ${
                                header.column.getIsResizing() ? 'isResizing' : ''
                            }`}
                        />
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index] as Row<TData>
              const isSelected = selectedRowIds.has(row.original.id);
              return (
                <TableRow
                  key={row.id}
                  data-state={isSelected && "selected"}
                  onClick={(e) => handleRowClick(e, row)}
                  className="cursor-pointer absolute w-full"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-1 h-[28px]" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-1">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedRows.length} of {data.length} row(s) selected.
        </div>
      </div>
    </div>
  )
}