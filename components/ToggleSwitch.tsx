// components/ToggleSwitch.tsx
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, id }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-300 cursor-pointer">
        {label}
      </label>
      <input
        type="checkbox"
        id={id}
        className="sr-only" // Hide the default checkbox visually
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
          checked ? 'bg-[var(--button-gradient-from)]' : 'bg-gray-200 dark:bg-gray-600'
        }`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </div>
  );
};

export default ToggleSwitch;