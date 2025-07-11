import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Settings {
  allowedFileTypes: string[]
  defaultImportFolder: string
  language: "en" | "de"
  toolbarStyle: "icons" | "text"
}

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  settings: Settings
  onSettingsChange: (newSettings: Partial<Settings>) => void
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsDialogProps) {
  const handleAllowedFileTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ allowedFileTypes: e.target.value.split(",").map(s => s.trim()) })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-types" className="text-right">
              Allowed File Types
            </Label>
            <Input
              id="file-types"
              value={settings.allowedFileTypes.join(", ")}
              onChange={handleAllowedFileTypesChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value) => onSettingsChange({ language: value as "en" | "de" })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="toolbar-style" className="text-right">
              Toolbar Style
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
               <Checkbox
                id="toolbar-style"
                checked={settings.toolbarStyle === "text"}
                onCheckedChange={(checked) =>
                  onSettingsChange({ toolbarStyle: checked ? "text" : "icons" })
                }
              />
              <label
                htmlFor="toolbar-style"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use text-based menu buttons
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
