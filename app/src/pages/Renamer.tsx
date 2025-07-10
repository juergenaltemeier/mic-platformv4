import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Toolbar } from "./programs/renamer/components/Toolbar"
import { useRenamer } from "./programs/renamer/hooks/useRenamer"
import { FilesTable } from "./programs/renamer/components/FilesTable"
import { PreviewPanel } from "./programs/renamer/components/PreviewPanel"
import { TagsPanel } from "./programs/renamer/components/TagsPanel"
import { RenamePreviewSheet } from "./programs/renamer/components/RenamePreviewSheet"

import { TooltipProvider } from "@/components/ui/tooltip"

export const RenamerPage = (): React.ReactElement => {
  const {
    files,
    selected,
    lastSelected,
    handleSelection,
    prefixNumber,
    setPrefixNumber,
    handleImport,
    handleImportFlat,
    previewOpen,
    setPreviewOpen,
    handleClearAll,
    handleRemoveSelected,
    settings,
    handleClearSuffix,
    setSettingsOpen,
    handleSetImportDirectory,
    handleUndoRename,
    selectNext,
    selectPrev,
    handleDateChange,
    handleSuffixChange,
    toggleTag,
    tagOptions,
    handleTagsCellChange,
    handleColumnResize,
    loadingState,
    handleApplyRename,
    canUndo,
    handleFilter,
  } = useRenamer()

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <Toolbar
          prefixNumber={prefixNumber}
          setPrefixNumber={setPrefixNumber}
          onImportFiles={handleImportFiles}
          onImportFolder={handleImportFolder}
          onImportFolderRecursive={handleImportFolderRecursive}
          onPreview={() => setPreviewOpen(true)}
          onApplyRename={handleApplyRename}
          onClearAll={handleClearAll}
          onRemoveSelected={handleRemoveSelected}
          onSettings={() => setSettingsOpen(true)}
          onSetImportDirectory={handleSetImportDirectory}
          allowedFileTypes={settings.allowedFileTypes}
          onUndo={handleUndoRename}
          canUndo={canUndo}
          onClearSuffix={handleClearSuffix}
          loadingState={loadingState}
        />
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel className="relative overflow-auto">
              <FilesTable
                files={files}
                onSelectionChange={handleSelection}
                onDateChange={handleDateChange}
                onSuffixChange={handleSuffixChange}
                onTagsChange={handleTagsCellChange}
                selectedRows={selected}
                columnSizes={settings.columnSizes}
                onColumnResize={handleColumnResize}
                onFilter={handleFilter}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                  <PreviewPanel
                    selected={lastSelected}
                    onNext={selectNext}
                    onPrev={selectPrev}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                  <TagsPanel
                    selected={selected}
                    onToggleTag={toggleTag}
                    tagOptions={tagOptions}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <RenamePreviewSheet
          isOpen={previewOpen}
          onOpenChange={setPreviewOpen}
          files={files}
        />
      </div>
    </TooltipProvider>
  )
}

export default RenamerPage;
