'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface WineSearchBarProps {
  onSearch: (search: string) => void;
}

export function WineSearchBar({ onSearch }: WineSearchBarProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Sök på namn, producent eller druva..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onSearch(value)}
          className="pl-9"
        />
      </div>
    </form>
  );
}
