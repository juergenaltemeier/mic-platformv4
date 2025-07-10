import { useState, useEffect } from 'react'
import { FileEntry } from '../types'
import { Button } from '../../../../components/ui/button'
import {
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  RotateCwIcon,
  MaximizeIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from 'lucide-react'

interface PreviewPanelProps {
  selected: FileEntry | null
  onNext: () => void
  onPrev: () => void
}

// Helper to convert a file path to a URL that Electron can use
const toFileUrl = (path: string): string => {
  if (!path) return ''
  return `file://${path.replace(/\\/g, '/')}`
}

export function PreviewPanel({ selected, onNext, onPrev }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    // Reset zoom and rotation when selection changes
    setZoom(1)
    setRotation(0)
  }, [selected])

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev * 1.1, 10)) // Zoom in, max 10x
    } else {
      setZoom((prev) => Math.max(prev / 1.1, 0.1)) // Zoom out, min 0.1x
    }
  }

  const zoomFit = () => setZoom(1)
  const rotateLeft = () => setRotation((prev) => prev - 90)
  const rotateRight = () => setRotation((prev) => prev + 90)

  const previewSrc = selected && selected.path ? toFileUrl(selected.path) : ''

  return (
    <div className="flex flex-col bg-background overflow-hidden w-full h-full">
      <div className="p-2 bg-popover border-b border-border flex items-center gap-2">
        <h3 className="text-foreground font-medium mr-auto">Preview</h3>
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ArrowRightIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom((z) => z * 1.2)}>
          <ZoomInIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom((z) => z / 1.2)}>
          <ZoomOutIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={zoomFit}>
          <MaximizeIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={rotateLeft}>
          <RotateCcwIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={rotateRight}>
          <RotateCwIcon className="size-4" />
        </Button>
      </div>
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        {selected && previewSrc && (
          <div
            className="transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {selected.file.type.startsWith('image') ? (
              <img
                src={previewSrc}
                className="max-h-full max-w-full object-contain"
                alt={selected.oldName}
              />
            ) : (
              <video
                src={previewSrc}
                controls
                className="max-h-full max-w-full"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
