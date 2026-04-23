import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { cn } from "../lib/utils";

type Props = {
  disabled?: boolean;
  onFile: (file: File) => void;
  fileName?: string | null;
  hint?: string;
};

export default function Uploader({ disabled, onFile, fileName, hint }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-zinc-950/50 p-5 ring-1 ring-white/10",
        dragOver && "ring-2 ring-emerald-400/40",
        disabled && "opacity-70",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
          <ImageUp className="h-5 w-5 text-emerald-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-zinc-100">拖拽图片到这里，或点击选择</div>
          <div className="mt-1 text-xs text-zinc-400">
            {fileName ? (
              <span className="font-mono text-zinc-300">{fileName}</span>
            ) : (
              <span>{hint ?? "支持照片 / 草图 / 截图，建议边长不超过 4000px"}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 ring-1 ring-white/10 hover:bg-zinc-900 disabled:cursor-not-allowed"
        >
          选择文件
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
