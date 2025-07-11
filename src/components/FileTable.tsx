import React from 'react';

interface FileTableProps {
  files: any[];
}

const FileTable: React.FC<FileTableProps> = ({ files }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold">File Table</h2>
      <ul>
        {files.map((file) => (
          <li key={file.id}>{file.oldName}</li>
        ))}
      </ul>
    </div>
  );
};

export default FileTable;