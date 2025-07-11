import React, { useState } from 'react';
import Toolbar from '../components/Toolbar';
import FileTable from '../components/FileTable';
import TagPanel from '../components/TagPanel';

// Assuming FileEntry is defined in a types file, but for now, we'll use 'any'
// import { FileEntry } from '../types'; 

const Renamer: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);

  return (
    <div className="flex flex-col h-screen">
      <Toolbar setFiles={setFiles} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <FileTable files={files} />
        </div>
        <div className="w-64 p-4 border-l border-gray-200 overflow-auto">
          <TagPanel />
        </div>
      </div>
    </div>
  );
};

export default Renamer;
