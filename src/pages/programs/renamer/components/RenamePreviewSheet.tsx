import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../../../components/ui/sheet'
import { FileEntry } from '../types'

interface RenamePreviewSheetProps {
  files: FileEntry[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function RenamePreviewSheet({
  files,
  isOpen,
  onOpenChange,
}: RenamePreviewSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Rename Preview</SheetTitle>
          <SheetDescription>Review your new file names before renaming.</SheetDescription>
        </SheetHeader>
        <div className="p-4 space-y-1">
          {files.map((file) => (
            <div key={file.id} className="text-sm font-mono">
              {file.oldName} -&gt; {file.newName}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}