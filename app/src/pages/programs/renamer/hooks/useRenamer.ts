import { useState, useRef, useEffect } from 'react'
import { FileEntry } from '../types'
import tagsJson from '../config/tags.json'
import { defaults } from '../config/defaults'
import { toast } from "sonner"
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

interface LoadingState {
  isLoading: boolean;
  progress: number;
}

interface FileWithPaths extends File {
  path: string;
  webkitRelativePath: string;
}

export function useRenamer() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selected, setSelected] = useState<FileEntry[]>([])
  const [lastSelected, setLastSelected] = useState<FileEntry | null>(null);
  const [renameHistory, setRenameHistory] = useState<{ oldPath: string; newPath: string }[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [prefixNumber, setPrefixNumber] = useState<string>('')
  const [previewOpen, setPreviewOpen] = useState<boolean>(false)
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, progress: 0 });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false)
  
  interface RenamerSettings {
    defaultImportFolder: string
    allowedFileTypes: string[]
    columnSizes: Record<string, number>
  }

  const defaultSettings: RenamerSettings = {
    defaultImportFolder: defaults.defaultImportDirectory,
    allowedFileTypes: defaults.acceptedExtensions.map((ext) =>
      ext.replace(/^\./, '')
    ),
    columnSizes: {},
  }
  const [settings, setSettings] = useState<RenamerSettings>(defaultSettings)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('renamerSettings')
      if (stored) {
        setSettings(JSON.parse(stored))
      } 
    } catch {
      // ignore parse errors
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('renamerSettings', JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [settings])

  const importFromEvent = async (
    filesList: FileList,
    recursive: boolean
  ): Promise<void> => {
    setLoadingState({ isLoading: true, progress: 0 });
    const fileArray = Array.from(filesList)
      .filter((f) => {
        const parts = f.name.split('.')
        const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : ''
        return settings.allowedFileTypes.includes(ext)
      })
      .filter((f) => f.type.startsWith('image') || f.type.startsWith('video'))
      .filter((f: File) => {
        if (recursive) return true
        const path = (f as FileWithPaths).webkitRelativePath as string | undefined
        if (!path) return true
        return path.split('/').length <= 2
      })

    const paths = fileArray.map(f => (f as FileWithPaths).path || f.webkitRelativePath || f.name);
    
    const newFiles: FileEntry[] = await invoke("init_files", { files: paths });
    setFiles(newFiles);

    if (newFiles.length > 0) {
        // How to get the first entry with ID?
        // For now, let's just clear selection
        setSelected([]);
        setLastSelected(null);
    }
    setLoadingState({ isLoading: false, progress: 100 });
  }

  const handleImportFiles = async (): Promise<void> => {
    const selected = await open({
      multiple: true,
      filters: [{
        name: 'Allowed Files',
        extensions: settings.allowedFileTypes,
      }]
    });
    if (Array.isArray(selected)) {
      const newFiles: FileEntry[] = await invoke("import_files_from_dialog", { paths: selected });
      setFiles(newFiles);
    }
  };

  const handleImportFolder = async (): Promise<void> => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === 'string') {
      const newFiles: FileEntry[] = await invoke("import_files_from_dialog", { paths: [selected], recursive: false });
      setFiles(newFiles);
    }
  };

  const handleImportFolderRecursive = async (): Promise<void> => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (typeof selected === 'string') {
      const newFiles: FileEntry[] = await invoke("import_files_from_dialog", { paths: [selected], recursive: true });
      setFiles(newFiles);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const fileList = e.target.files
    if (!fileList) return
    importFromEvent(fileList, true)
  }

  const handleImportFlat = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const fileList = e.target.files
    if (!fileList) return
    importFromEvent(fileList, false)
  }

  const tagOptions = Object.entries(tagsJson).map(([id, labels]) => ({
    id,
    description: (labels as Record<string, string>)[defaults.language] ||
           (labels as Record<string, string>)['en'] || id,
  }))

  const toggleTag = (tag: string): void => {
    if (selected.length === 0) return;
    const fileIds = selected.map(s => s.id);
    invoke("toggle_tag", { fileIds, tag }).then(setFiles);
  };

  const handleTagsCellChange = (entry: FileEntry, tags: string[]): void => {
    invoke("update_tags", { fileId: entry.id, tags }).then(setFiles);
  };

  const handleDateChange = (
    entry: FileEntry,
    date: Date
  ): void => {
    invoke("update_date", { fileId: entry.id, date: date.toISOString() }).then(setFiles);
  }

  const handleSuffixChange = (
    entry: FileEntry,
    newSuffix: string
  ): void => {
    invoke("update_suffix", { fileId: entry.id, suffix: newSuffix }).then(setFiles);
  };
  
  const handleUndoRename = async (): Promise<void> => {
    if (renameHistory.length === 0) return;

    try {
      const result: any = await invoke('undo_rename', { renameHistory });
      
      if (result.errorCount > 0) {
        const errorDescription = result.errors.slice(0, 5).map(e => e.file).join(', ');
        const moreErrors = result.errors.length > 5 ? ` and ${result.errors.length - 5} more...` : '';
        
        toast.error(`Failed to undo rename for ${result.errorCount} file(s).`, {
          description: `Could not undo: ${errorDescription}${moreErrors}. See console for details.`,
        });
        console.error('Undo rename errors:', result.errors);
      } else {
        toast.success(`Successfully restored ${result.successCount} file(s).`);
        setRenameHistory([]);
        setCanUndo(false);
      }
    } catch (error) {
      console.error('Failed to undo rename:', error);
      toast.error('An error occurred while undoing the file renames.');
    }
  };

  const handleRemoveSelected = (): void => {
    if (selected.length > 0) {
        const fileIds = selected.map(s => s.id);
        invoke("remove_files", { fileIds }).then(setFiles);
        setSelected([])
    }
  }

  const handleClearSuffix = (): void => {
    if (selected.length > 0) {
        const fileIds = selected.map(s => s.id);
        invoke("clear_suffix", { fileIds }).then(setFiles);
    }
  }

  const handleClearAll = (): void => {
    invoke("clear_all").then(setFiles);
    setSelected([])
  }

  const handleSetImportDirectory = async (): Promise<void> => {
    try {
      const selectedDir = await open({
        directory: true,
        multiple: false,
        defaultPath: settings.defaultImportFolder,
      });
      if (selectedDir) {
        setSettings({ ...settings, defaultImportFolder: selectedDir as string })
      }
    } catch {
      // ignore
    }
  }

  const handleSelection = (entry: FileEntry, ctrlKey: boolean, shiftKey: boolean): void => {
    const currentIndex = files.findIndex(f => f.id === entry.id);
    if (shiftKey && lastSelected) {
      const lastIndex = files.findIndex(f => f.id === lastSelected.id);
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const range = files.slice(start, end + 1);
      setSelected(range);
    } else if (ctrlKey) {
      const newSelection = selected.some(sel => sel.id === entry.id)
        ? selected.filter(sel => sel.id !== entry.id)
        : [...selected, entry];
      setSelected(newSelection);
      setLastSelected(entry);
    } else {
      setSelected([entry]);
      setLastSelected(entry);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelected(files);
        return;
      }

      if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (!lastSelected) {
            if (files.length > 0) {
                const newSelected = files[0];
                setSelected([newSelected]);
                setLastSelected(newSelected);
            }
            return;
        }

        const lastIndex = files.findIndex(f => f.id === lastSelected.id);
        const nextIndex = e.key === 'ArrowDown' ? lastIndex + 1 : lastIndex - 1;

        if (nextIndex >= 0 && nextIndex < files.length) {
          const nextFile = files[nextIndex];
          const currentSelection = selected.map(s => s.id);
          const lastSelectedIndexInSelection = selected.findIndex(s => s.id === lastSelected.id);

          if (currentSelection.includes(nextFile.id)) {
            const newSelection = selected.filter((_,i) => i !== lastSelectedIndexInSelection);
            setSelected(newSelection);
          } else {
            const newSelection = [...selected, nextFile];
            setSelected(newSelection);
          }
          setLastSelected(nextFile);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [files, selected, lastSelected]);

    const selectNext = (): void => {
    if (!lastSelected) return
    const currentIndex = files.findIndex((f) => f.id === lastSelected.id)
    if (currentIndex < files.length - 1) {
      const nextFile = files[currentIndex + 1]
      setSelected([nextFile])
      setLastSelected(nextFile)
    }
  }

  const selectPrev = (): void => {
    if (!lastSelected) return
    const currentIndex = files.findIndex((f) => f.id === lastSelected.id)
    if (currentIndex > 0) {
      const prevFile = files[currentIndex - 1]
      setSelected([prevFile])
      setLastSelected(prevFile)
    }
  }

  const handleColumnResize = (newSizes: Record<string, number>): void => {
    setSettings(prev => ({ ...prev, columnSizes: newSizes }));
  };

  const handleApplyRename = async (): Promise<void> => {
    if (files.length === 0) return;

    try {
      const result: any = await invoke('rename_files', { filesToRename: files });
      
      if (result.errorCount > 0) {
        const errorDescription = result.errors.slice(0, 5).map(e => e.file).join(', ');
        const moreErrors = result.errors.length > 5 ? ` and ${result.errors.length - 5} more...` : '';
        
        toast.error(`Failed to rename ${result.errorCount} file(s).`, {
          description: `Could not rename: ${errorDescription}${moreErrors}. See console for details.`,
        });
        console.error('Rename errors:', result.errors);
      } else {
        toast.success(`Successfully renamed ${result.successCount} file(s).`);
        setFiles([]);
        setSelected([]);
        setLastSelected(null);
        setRenameHistory(files.map(f => ({ oldPath: f.path, newPath: f.newName })));
        setCanUndo(true);
      }
    } catch (error) {
      console.error('Failed to apply rename:', error);
      toast.error('An error occurred while renaming the files.');
    }
  };

  const handleFilter = (filter: string) => {
    invoke("filter_files", { filter }).then(setFiles);
  }

  useEffect(() => {
    invoke("update_prefix", { prefix: prefixNumber }).then(setFiles);
  }, [prefixNumber]);

  return {
    files,
    selected,
    lastSelected,
    handleSelection,
    prefixNumber,
    setPrefixNumber,
    handleImport,
    handleImportFlat,
    tagOptions,
    toggleTag,
    handleTagsCellChange,
    handleSuffixChange,
    previewOpen,
    setPreviewOpen,
    settingsOpen,
    setSettingsOpen,
    settings,
    handleSetImportDirectory,
    handleUndoRename,
    handleRemoveSelected,
    handleClearSuffix,
    handleClearAll,
    handleDateChange,
    selectNext,
    selectPrev,
    handleColumnResize,
    loadingState,
    handleApplyRename,
    canUndo,
    handleFilter,
  }
}
