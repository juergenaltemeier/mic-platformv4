import React from 'react';
import { invoke, dialog } from '@tauri-apps/api/core';

interface ToolbarProps {
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
}

const Toolbar: React.FC<ToolbarProps> = ({ setFiles }) => {
  const handleAddFiles = async () => {
    try {
      const selected = await dialog.open({
        multiple: true,
      });
      if (selected) {
        const importedFiles = await invoke('import_files_from_dialog', { paths: selected, recursive: false });
        setFiles(importedFiles as any[]);
      }
    } catch (error) {
      console.error('Failed to import files:', error);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-bold">Toolbar</h2>
      <button onClick={handleAddFiles} className="px-4 py-2 bg-blue-500 text-white rounded">
        Add Files
      </button>
    </div>
  );
};

export default Toolbar;