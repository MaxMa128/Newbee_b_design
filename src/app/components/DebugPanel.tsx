import { useState, useRef, useEffect, useCallback } from "react";
import { Bug, ChevronDown, ChevronUp, GripHorizontal } from "lucide-react";

export type DebugAction = {
  label: string;
  color?: "red" | "amber" | "green" | "blue" | "slate";
  action: () => void;
};

export type DebugGroup = {
  title: string;
  actions: DebugAction[];
};

interface DebugPanelProps {
  groups: DebugGroup[];
}

const COLOR_CLASSES: Record<NonNullable<DebugAction["color"]>, string> = {
  red:   "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  blue:  "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  slate: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
};

export function DebugPanel({ groups }: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialise position bottom-right after mount
  useEffect(() => {
    setPos({ x: window.innerWidth - 260, y: window.innerHeight - 380 });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the handle bar
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - (pos?.x ?? 0),
      y: e.clientY - (pos?.y ?? 0),
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - 240, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (pos === null) return null;

  return (
    <div
      ref={panelRef}
      style={{ left: pos.x, top: pos.y, userSelect: "none" }}
      className="fixed z-[9999] w-56"
    >
      {/* Collapsed / expanded body */}
      {expanded && (
        <div className="mb-1 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "border-t border-slate-100" : ""}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              <div className="px-2 pb-2 space-y-1">
                {group.actions.map((action, ai) => (
                  <button
                    key={ai}
                    onClick={action.action}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${COLOR_CLASSES[action.color ?? "slate"]}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag handle + toggle button */}
      <div
        className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-800/80 backdrop-blur-sm shadow-lg px-3 py-2 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
      >
        <GripHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Bug className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-xs font-medium text-slate-200 flex-1">調試面板</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
