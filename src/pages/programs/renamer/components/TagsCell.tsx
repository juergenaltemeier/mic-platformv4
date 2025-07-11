import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FileEntry } from '../types';
import { Row } from '@tanstack/react-table';

interface TagsCellProps {
  row: Row<FileEntry>;
  onTagsChange: (entry: FileEntry, newTags: string[]) => void;
}

export function TagsCell({ row, onTagsChange }: TagsCellProps): React.ReactElement {
  const { tags } = row.original;
  const [value, setValue] = useState(tags.join(', '));

  useEffect(() => {
    setValue(tags.join(', '));
  }, [tags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setValue(e.target.value);
  };

  const handleBlur = (): void => {
    onTagsChange(row.original, value.split(',').map(t => t.trim()).filter(Boolean));
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
