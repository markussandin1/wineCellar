'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode, Ref } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AutocompleteProps {
  id: string;
  name: string;
  value?: string | null;
  onChange: (value: string) => void;
  onSelect?: (item: any) => void;
  fetchSuggestions: (query: string) => Promise<any[]>;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  renderSuggestion?: (item: any) => ReactNode;
  getSuggestionValue?: (item: any) => string;
  minChars?: number;
  debounceMs?: number;
  disabled?: boolean;
}

export function Autocomplete({
  id,
  name,
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  onBlur,
  inputRef,
  placeholder,
  required = false,
  renderSuggestion,
  getSuggestionValue,
  minChars = 2,
  debounceMs = 300,
  disabled = false,
}: AutocompleteProps) {
  const safeValue = value ?? '';
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (safeValue.length < minChars) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(safeValue);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [safeValue, fetchSuggestions, minChars, debounceMs]);

  const handleSelect = (item: any) => {
    const itemValue = getSuggestionValue ? getSuggestionValue(item) : item;
    onChange(itemValue);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full rounded-md border bg-background px-3 py-2 pr-10"
          autoComplete="off"
          ref={inputRef}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                index === highlightedIndex ? 'bg-accent' : ''
              }`}
            >
              {renderSuggestion ? renderSuggestion(item) : item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
