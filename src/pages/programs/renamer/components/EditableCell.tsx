import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FileEntry } from '../types';
import { Row } from '@tanstack/react-table';

interface EditableCellProps {
  row: Row<FileEntry>;
  onSuffixChange: (entry: FileEntry, newSuffix: string) => void;
}

export function EditableCell({ row, onSuffixChange }: EditableCellProps): React.ReactElement {
  const { suffix } = row.original;
  const [value, setValue] = useState(suffix);

  useEffect(() => {
    setValue(suffix);
  }, [suffix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Disallow characters that are invalid in filenames
    const sanitized = e.target.value.replace(/[<>:"/\\|?*]/g, '');
    setValue(sanitized);
  };

  const handleBlur = (): void => {
    onSuffixChange(row.original, value);
  };


  return (
    <Input
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className="h-6 p-1"
    />
  );
}
