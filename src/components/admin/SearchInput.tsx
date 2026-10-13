'use client';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  'aria-label': string;
  className?: string;
  id?: string;
};

/**
 * Shared admin search field — placeholder text instead of an icon.
 */
export function SearchInput({
  value,
  onChange,
  'aria-label': ariaLabel,
  className = '',
  id,
}: SearchInputProps) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="search...."
        aria-label={ariaLabel}
        className="admin-input h-10 w-full"
      />
    </div>
  );
}
