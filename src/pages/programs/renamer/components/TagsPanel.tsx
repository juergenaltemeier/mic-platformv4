import { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../../components/ui/tooltip'
import { FileEntry } from '../types'
import { ScrollArea } from '../../../../components/ui/scroll-area'
import { Input } from '../../../../components/ui/input'

interface TagsPanelProps {
  tagOptions: { id: string; description: string }[]
  selected: FileEntry[]
  onToggleTag: (tag: string) => void
}

export function TagsPanel({ tagOptions, selected, onToggleTag }: TagsPanelProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('')

  const getTagVariant = (tagId: string): "outline" | "secondary" | "ghost" => {
    if (selected.length === 0) return 'outline'
    const isSelectedInAll = selected.every(file => file.tags.includes(tagId));
    if (isSelectedInAll) return 'secondary';
    const isSelectedInSome = selected.some(file => file.tags.includes(tagId));
    if (isSelectedInSome) return 'ghost';
    return 'outline';
  }

  const filteredTags = tagOptions.filter(tag => {
    const term = searchTerm.toLowerCase();
    return tag.id.toLowerCase().includes(term) || tag.description.toLowerCase().includes(term)
  })

  return (
    <div className="overflow-auto bg-background p-2 border-t border-border h-full flex flex-col">
      <h3 className="font-medium mb-2">Tags</h3>
      <Input
        placeholder="Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />
      <ScrollArea className="h-full">
        <div className="flex flex-wrap gap-2">
          {filteredTags.map(({ id, description }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={getTagVariant(id)}
                  onClick={() => onToggleTag(id)}
                  disabled={selected.length === 0}
                >
                  {id}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}