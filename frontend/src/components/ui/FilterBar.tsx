'use client';

interface FilterOption {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterOption[];
  sortValue?: string;
  sortOptions?: { value: string; label: string }[];
  onSortChange?: (value: string) => void;
}

export default function FilterBar({ filters, sortValue, sortOptions, onSortChange }: FilterBarProps) {
  return (
    <div className="bg-surface-container-low rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-4">
      {filters.map((filter) => (
        <div key={filter.label} className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-lg border-0 shadow-sm">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{filter.label}:</span>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="border-none focus:ring-0 text-sm font-medium bg-transparent py-0 pr-8"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
      {sortOptions && onSortChange && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">Sort by:</span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="border-none focus:ring-0 text-sm font-bold bg-transparent py-0"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
