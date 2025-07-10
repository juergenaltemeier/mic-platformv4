"use client"

import { getColumns } from './columns'
import { DataTable } from './data-table'
import { FileEntry } from '../types'

interface FilesTableProps {
  files: FileEntry[]
  onSelectionChange: (entry: FileEntry, ctrlKey: boolean, shiftKey: boolean) => void;
  onDateChange: (entry: FileEntry, date: Date) => void
  onSuffixChange: (entry: FileEntry, newSuffix: string) => void
  onTagsChange: (entry: FileEntry, newTags: string[]) => void
  selectedRows: FileEntry[]
  columnSizes: Record<string, number>
  onColumnResize: (newSizes: Record<string, number>) => void
  onFilter: (filter: string) => void;
}

export function FilesTable({ files, onSelectionChange, onDateChange, onSuffixChange, onTagsChange, selectedRows, columnSizes, onColumnResize, onFilter }: FilesTableProps): React.ReactElement {
  const columns = getColumns({ onDateChange, onSuffixChange, onTagsChange });

  return (
    <div className="h-full flex flex-col">
      <DataTable 
        columns={columns} 
        data={files} 
        onSelectionChange={onSelectionChange} 
        selectedRows={selectedRows} 
        columnSizes={columnSizes} 
        onColumnResize={onColumnResize}
        onFilter={onFilter}
      />
    </div>
  )
}