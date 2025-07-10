// src/renderer/src/pages/programs/renamer/renamer.worker.ts
import { FileEntry } from './types';

let files: FileEntry[] = [];
let filteredFiles: FileEntry[] = [];
let filterTerm = '';

const formatDate = (d: number): string => {
  const dt = new Date(d);
  return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(
    dt.getDate()
  ).padStart(2, '0')}`;
};

const generateNewName = (file: FileEntry, index: number, totalFiles: number, prefix: string): string => {
    const tagsPart = file.tags.join('-') || 'NOTAGS';
    const datePart = formatDate(file.date);
    const inc = totalFiles > 1 ? `_${index + 1}` : '';
    const suffixPart = file.suffix ? `_${file.suffix}` : '';
    return `${prefix}_${tagsPart}_${datePart}${inc}${suffixPart}`;
}

const updateAllNewNames = (prefix: string) => {
    files = files.map((file, index) => ({
        ...file,
        newName: generateNewName(file, index, files.length, prefix)
    }));
    filterFiles();
}

const filterFiles = () => {
    if (!filterTerm) {
        filteredFiles = files;
    } else {
        const lowercasedFilter = filterTerm.toLowerCase();
        filteredFiles = files.filter(file => file.oldName.toLowerCase().includes(lowercasedFilter));
    }
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      files = payload.files.map((file: FileEntry) => ({
        ...file,
        id: crypto.randomUUID(),
      }));
      updateAllNewNames('C');
      self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
      break;
    
    case 'FILTER':
      filterTerm = payload.filter;
      filterFiles();
      self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
      break;

    case 'UPDATE_PREFIX':
        updateAllNewNames(payload.prefix ? `C${payload.prefix}`: 'C');
        self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
        break;

    case 'UPDATE_FILE':
        const { fileId, newFile } = payload;
        const fileIndex = files.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
            files[fileIndex] = newFile;
            updateAllNewNames('C'); // This could be optimized
        }
        break;
    
    case 'TOGGLE_TAG':
        {
            const { fileIds, tag } = payload;
            const fileIdsSet = new Set(fileIds);
            const isSelectedInAll = files.filter(f => fileIdsSet.has(f.id)).every(file => file.tags.includes(tag));

            files = files.map(file => {
                if (fileIdsSet.has(file.id)) {
                    const newTags = isSelectedInAll
                    ? file.tags.filter(t => t !== tag)
                    : [...new Set([...file.tags, tag])];
                    return { ...file, tags: newTags };
                }
                return file;
            });
            updateAllNewNames('C');
            self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
        }
        break;
    
    case 'UPDATE_TAGS':
        {
            const { fileId, tags } = payload;
            const fileIndex = files.findIndex(f => f.id === fileId);
            if (fileIndex > -1) {
                files[fileIndex].tags = tags;
                updateAllNewNames('C');
                self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
            }
        }
        break;

    case 'UPDATE_DATE':
        {
            const { fileId, date } = payload;
            const fileIndex = files.findIndex(f => f.id === fileId);
            if (fileIndex > -1) {
                files[fileIndex].date = date;
                updateAllNewNames('C');
                self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
            }
        }
        break;
    
    case 'UPDATE_SUFFIX':
        {
            const { fileId, suffix } = payload;
            const fileIndex = files.findIndex(f => f.id === fileId);
            if (fileIndex > -1) {
                files[fileIndex].suffix = suffix;
                updateAllNewNames('C');
                self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
            }
        }
        break;
    
    case 'REMOVE_FILES':
        {
            const fileIdsSet = new Set(payload.fileIds);
            files = files.filter(f => !fileIdsSet.has(f.id));
            updateAllNewNames('C');
            self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
        }
        break;
    
    case 'CLEAR_ALL':
        files = [];
        filteredFiles = [];
        self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
        break;
    
    case 'CLEAR_SUFFIX':
        {
            const fileIdsSet = new Set(payload.fileIds);
            files = files.map(f => {
                if (fileIdsSet.has(f.id)) {
                    return { ...f, suffix: '' };
                }
                return f;
            });
            updateAllNewNames('C');
            self.postMessage({ type: 'UPDATE', payload: { files: filteredFiles } });
        }
        break;
  }
};
