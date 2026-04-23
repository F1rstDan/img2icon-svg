import { cn } from "../lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  className?: string;
};

export default function Segmented<T extends string>({ value, onChange, options, className }: Props<T>) {
  return (
    <div className={cn("inline-flex rounded-xl bg-zinc-900/70 p-1 ring-1 ring-white/10", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-sm transition",
              active
                ? "rounded-lg bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/30"
                : "text-zinc-300 hover:text-zinc-100",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
