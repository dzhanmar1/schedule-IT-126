
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black",
        checked ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="sr-only">Toggle</span>
      <motion.span
        layout
        initial={false}
        animate={{
          x: checked ? 20 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        className={cn(
          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 dark:bg-white"
        )}
      />
    </button>
  );
}
