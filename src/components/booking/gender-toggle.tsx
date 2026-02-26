interface GenderToggleProps {
  value: 'm' | 'f';
  onChange: (value: 'm' | 'f') => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="book-gender-toggle">
      <button
        type="button"
        className={`book-gender-option ${value === 'm' ? 'book-gender-active' : ''}`}
        onClick={() => onChange('m')}
      >
        ذكر
      </button>
      <button
        type="button"
        className={`book-gender-option ${value === 'f' ? 'book-gender-active' : ''}`}
        onClick={() => onChange('f')}
      >
        أنثى
      </button>
    </div>
  );
}
