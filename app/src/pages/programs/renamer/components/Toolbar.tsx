import { type ChangeEvent } from 'react'
import { Button } from '../../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../../../../components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../../../components/ui/input-otp'
import { Progress } from '../../../../components/ui/progress'

interface LoadingState {
  isLoading: boolean;
  progress: number;
}

interface ToolbarProps {
  onImportFiles: () => void
  onImportFolder: () => void
  onImportFolderRecursive: () => void
  onSettings: () => void
  onSetImportDirectory: () => void
  prefixNumber: string
  setPrefixNumber: (val: string) => void
  onPreview: () => void
  onApplyRename: () => void
  allowedFileTypes: string[]
  onUndo: () => void
  onRemoveSelected: () => void
  onClearSuffix: () => void
  onClearAll: () => void
  loadingState: LoadingState
  canUndo?: boolean
}

export function Toolbar({
  onImportFiles,
  onImportFolder,
  onImportFolderRecursive,
  onSettings,
  onSetImportDirectory,
  prefixNumber,
  setPrefixNumber,
  onPreview,
  onApplyRename,
  onUndo,
  onRemoveSelected,
  onClearSuffix,
  onClearAll,
  loadingState,
  canUndo,
}: ToolbarProps): React.ReactElement {
  return (
    <div className="w-full bg-background border-b border-border">
      <div className="flex items-start justify-start gap-4 p-2">
        {/* File Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              File <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onImportFiles}>
              Add Files
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportFolder}>
              Add Folder
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportFolderRecursive}>
              Add Folder (recursive)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSetImportDirectory}>
              Set Import Directory
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Edit Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              Edit <ChevronDownIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onUndo} disabled={!canUndo}>
              Undo Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemoveSelected}>Remove Selected</DropdownMenuItem>
            <DropdownMenuItem onSelect={onClearSuffix}>Clear Suffix</DropdownMenuItem>
            <DropdownMenuItem onSelect={onClearAll}>Clear List</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSettings}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Prefix Input */}
        <div className="flex items-center space-x-2">
          <span className="font-bold">C</span>
          <InputOTP
            maxLength={6}
            value={prefixNumber}
            onChange={setPrefixNumber}
            containerClassName=""
            className="gap-1"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {/* Preview Button */}
        <Button onClick={onPreview}>Rename Preview</Button>
        <Button onClick={onApplyRename} variant="destructive">Apply Rename</Button>
      </div>
      {loadingState.isLoading && (
        <div className="p-2">
          <Progress value={loadingState.progress} />
        </div>
      )}
    </div>
  )
}