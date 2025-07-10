import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: {
    defaultImportFolder: string
    allowedFileTypes: string[]
  }
  setSettings: (settings: {
    defaultImportFolder: string
    allowedFileTypes: string[]
  }) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  setSettings,
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
    }
  }, [open, settings])

  const imageOptions = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
  const videoOptions = ['mp4', 'mov', 'avi', 'mkv']

  const handleBrowse = async () => {
    // Invoke native dialog to select folder
    const selected = await window.electron.ipcRenderer.invoke(
      'dialog:selectDirectory',
      localSettings.defaultImportFolder
    )
    if (selected) {
      setLocalSettings({ ...localSettings, defaultImportFolder: selected })
    }
  }

  const toggleFileType = (ext: string) => {
    setLocalSettings((prev) => {
      const has = prev.allowedFileTypes.includes(ext)
      const list = has
        ? prev.allowedFileTypes.filter((e) => e !== ext)
        : [...prev.allowedFileTypes, ext]
      return { ...prev, allowedFileTypes: list }
    })
  }

  const handleSave = () => {
    setSettings(localSettings)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure renamer preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium">
              Default Import Folder
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <Input
                className="flex-1"
                value={localSettings.defaultImportFolder}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    defaultImportFolder: e.target.value,
                  })
                }
                placeholder="Select a folder"
              />
              <Button variant="outline" size="sm" onClick={handleBrowse}>
                Browse
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Allowed File Types
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Image Formats</h3>
                <div className="space-y-1">
                  {imageOptions.map((ext) => (
                    <label
                      key={ext}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={localSettings.allowedFileTypes.includes(
                          ext
                        )}
                        onChange={() => toggleFileType(ext)}
                        className="h-4 w-4 rounded border text-primary focus:ring-2 focus:ring-offset-0"
                      />
                      <span className="text-sm uppercase">{ext}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Video Formats</h3>
                <div className="space-y-1">
                  {videoOptions.map((ext) => (
                    <label
                      key={ext}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={localSettings.allowedFileTypes.includes(
                          ext
                        )}
                        onChange={() => toggleFileType(ext)}
                        className="h-4 w-4 rounded border text-primary focus:ring-2 focus:ring-offset-0"
                      />
                      <span className="text-sm uppercase">{ext}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}