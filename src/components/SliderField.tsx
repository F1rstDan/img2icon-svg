import { cn } from "../lib/utils";

type Props = {
  label: string;
  valueLabel?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  className?: string;
};

export default function SliderField({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-200">{label}</div>
        <div className="font-mono text-xs text-zinc-400">{valueLabel ?? value.toFixed(2)}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.valueAsNumber)}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800",
          "accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
    </div>
  );
}
