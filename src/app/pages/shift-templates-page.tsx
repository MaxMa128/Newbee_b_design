import { useState } from "react";
import { Plus, Pencil, Trash2, Clock, AlertTriangle, Copy, X } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

// ── Types ──────────────────────────────────────────────────
interface CustomDaySlot { id: string; day: string; start: string; end: string; }

interface ShiftTemplate {
  id: string;
  name: string;
  type: "weekly" | "custom";
  weeklyDays?: string[];
  weeklyStart?: string;
  weeklyEnd?: string;
  customDays?: Omit<CustomDaySlot, "id">[];
  usageCount: number;
}

// ── Constants ──────────────────────────────────────────────
const WEEKDAY_KEYS    = ["mon","tue","wed","thu","fri","sat","sun"] as const;
const WEEKDAY_LABELS  = ["週一","週二","週三","週四","週五","週六","週日"];
const WEEKDAY_MAP     = Object.fromEntries(WEEKDAY_KEYS.map((k, i) => [k, WEEKDAY_LABELS[i]]));

// ── Mock data ──────────────────────────────────────────────
const INITIAL: ShiftTemplate[] = [
  { id: "ST-001", name: "標準兼職班（週一至週五）",  type: "weekly", weeklyDays: ["mon","tue","wed","thu","fri"], weeklyStart: "09:00", weeklyEnd: "18:00", usageCount: 5 },
  { id: "ST-002", name: "週末班次",                  type: "weekly", weeklyDays: ["sat","sun"],                  weeklyStart: "10:00", weeklyEnd: "22:00", usageCount: 3 },
  { id: "ST-003", name: "全週晚班",                  type: "weekly", weeklyDays: ["mon","tue","wed","thu","fri","sat","sun"], weeklyStart: "17:00", weeklyEnd: "23:00", usageCount: 4 },
  { id: "ST-004", name: "彈性三天班",                type: "custom", customDays: [{ day:"mon", start:"08:00", end:"12:00" }, { day:"wed", start:"14:00", end:"18:00" }, { day:"fri", start:"08:00", end:"20:00" }], usageCount: 1 },
  { id: "ST-005", name: "週末促銷班",                type: "custom", customDays: [{ day:"sat", start:"10:00", end:"15:00" }, { day:"sun", start:"12:00", end:"20:00" }], usageCount: 2 },
];

// ── Helpers ────────────────────────────────────────────────
function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

function calcWeeklyHours(t: ShiftTemplate): number {
  if (t.type === "weekly") {
    const h = calcHours(t.weeklyStart ?? "00:00", t.weeklyEnd ?? "00:00");
    return Math.round((t.weeklyDays?.length ?? 0) * h * 10) / 10;
  }
  return Math.round((t.customDays ?? []).reduce((s, d) => s + calcHours(d.start, d.end), 0) * 10) / 10;
}

function formatDaysRange(days: string[]): string {
  if (!days.length) return "—";
  const indices = days.map(d => WEEKDAY_KEYS.indexOf(d as typeof WEEKDAY_KEYS[number])).sort((a,b)=>a-b);
  // Check if consecutive
  const isConsec = indices.every((v, i) => i === 0 || v === indices[i-1] + 1);
  if (isConsec && indices.length >= 3) {
    return `${WEEKDAY_LABELS[indices[0]]}至${WEEKDAY_LABELS[indices[indices.length-1]]}`;
  }
  return indices.map(i => WEEKDAY_LABELS[i]).join("、");
}

// ── Template form ──────────────────────────────────────────
function TemplateForm({ existing, onClose, onSave }: {
  existing: ShiftTemplate | null;
  onClose: () => void;
  onSave: (t: Omit<ShiftTemplate, "id" | "usageCount">) => void;
}) {
  const [name, setName]             = useState(existing?.name ?? "");
  const [type, setType]             = useState<"weekly" | "custom">(existing?.type ?? "weekly");
  const [weeklyDays, setWeeklyDays] = useState<string[]>(existing?.weeklyDays ?? ["mon","tue","wed","thu","fri"]);
  const [weeklyStart, setWeeklyStart] = useState(existing?.weeklyStart ?? "09:00");
  const [weeklyEnd, setWeeklyEnd]     = useState(existing?.weeklyEnd ?? "18:00");
  const [rows, setRows] = useState<CustomDaySlot[]>(
    existing?.customDays?.map((d, i) => ({ ...d, id: String(i) })) ??
    [{ id: "0", day: "mon", start: "09:00", end: "18:00" }]
  );

  const toggleDay = (d: string) =>
    setWeeklyDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const addRow = () =>
    setRows(prev => [...prev, { id: Date.now().toString(), day: "mon", start: "09:00", end: "18:00" }]);

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CustomDaySlot, val: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));

  const weeklyHoursPreview = type === "weekly"
    ? Math.round((weeklyDays.length * calcHours(weeklyStart, weeklyEnd)) * 10) / 10
    : Math.round(rows.reduce((s, r) => s + calcHours(r.start, r.end), 0) * 10) / 10;

  const canSave = name.trim() && (
    type === "weekly" ? weeklyDays.length > 0 && weeklyStart < weeklyEnd
                      : rows.length > 0 && rows.every(r => r.start < r.end)
  );

  const cls = "text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 shrink-0">
          <DialogTitle className="text-base font-semibold text-slate-900">{existing ? "編輯班次模板" : "新增班次模板"}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">設定可複用的班次時間組合</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">模板名稱 <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例：標準兼職班、週末晚班…" className={`w-full ${cls}`} />
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">設定方式 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: "weekly" as const, label: "按週統一設定", sub: "所有選定日期使用同一時段" },
                { val: "custom" as const, label: "每天自訂時段", sub: "每天可設定不同的時間段" },
              ]).map(opt => (
                <button key={opt.val} type="button" onClick={() => setType(opt.val)}
                  className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all ${type === opt.val ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <span className={`text-sm font-medium ${type === opt.val ? "text-blue-700" : "text-slate-800"}`}>{opt.label}</span>
                  <span className="text-xs text-slate-400">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly settings */}
          {type === "weekly" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">工作日 <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_KEYS.map((k, i) => (
                    <button key={k} type="button" onClick={() => toggleDay(k)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${weeklyDays.includes(k) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                      {WEEKDAY_LABELS[i]}
                    </button>
                  ))}
                </div>
                {weeklyDays.length === 0 && <p className="text-xs text-amber-600">請至少選擇一個工作日</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">上班時間 <span className="text-red-500">*</span></label>
                  <input type="time" value={weeklyStart} onChange={e => setWeeklyStart(e.target.value)} className={`w-full ${cls}`} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">下班時間 <span className="text-red-500">*</span></label>
                  <input type="time" value={weeklyEnd} onChange={e => setWeeklyEnd(e.target.value)} className={`w-full ${cls}`} />
                </div>
              </div>
              {weeklyStart >= weeklyEnd && weeklyStart && weeklyEnd && (
                <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />下班時間必須晚於上班時間</p>
              )}
            </div>
          )}

          {/* Custom settings */}
          {type === "custom" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">自訂時段 <span className="text-red-500">*</span></label>
                <button type="button" onClick={addRow}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" />新增時段
                </button>
              </div>
              <div className="space-y-2">
                {rows.map((row, idx) => (
                  <div key={row.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <select value={row.day} onChange={e => updateRow(row.id, "day", e.target.value)}
                      className={`${cls} w-24 shrink-0`}>
                      {WEEKDAY_KEYS.map((k, i) => <option key={k} value={k}>{WEEKDAY_LABELS[i]}</option>)}
                    </select>
                    <input type="time" value={row.start} onChange={e => updateRow(row.id, "start", e.target.value)}
                      className={`${cls} flex-1 min-w-0`} />
                    <span className="text-slate-400 text-sm shrink-0">–</span>
                    <input type="time" value={row.end} onChange={e => updateRow(row.id, "end", e.target.value)}
                      className={`${cls} flex-1 min-w-0`} />
                    <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1}
                      className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30 shrink-0 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {rows.some(r => r.start >= r.end) && (
                <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />部分時段的下班時間早於上班時間</p>
              )}
            </div>
          )}

          {/* Preview */}
          {canSave && (
            null
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!canSave}
            onClick={() => {
              onSave({
                name, type,
                ...(type === "weekly" ? { weeklyDays, weeklyStart, weeklyEnd } : {}),
                ...(type === "custom" ? { customDays: rows.map(({ id, ...r }) => r) } : {}),
              });
              onClose();
            }}>
            {existing ? "儲存修改" : "建立模板"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Template card ──────────────────────────────────────────
function TemplateCard({ template, onEdit, onDuplicate, onDelete }: {
  template: ShiftTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const hours = calcWeeklyHours(template);
  const isWeekly = template.type === "weekly";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-base font-semibold text-slate-900">{template.name}</span>
            
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onDuplicate} title="複製模板" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={onEdit} title="編輯" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} disabled={template.usageCount > 0} title={template.usageCount > 0 ? "有職位正在使用此模板" : "刪除"} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Schedule details */}
      <div className="space-y-2">
        {isWeekly ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1">
              {(template.weeklyDays ?? []).map(d => (
                <span key={d} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium">{WEEKDAY_MAP[d]}</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              {template.weeklyStart} – {template.weeklyEnd}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {(template.customDays ?? []).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-9 px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded text-[10px] font-medium text-center shrink-0">{WEEKDAY_MAP[d.day]}</span>
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-medium tabular-nums">{d.start} – {d.end}</span>
                <span className="text-slate-400">({calcHours(d.start, d.end)}h)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        
        <div className="text-xs text-slate-400">
          {template.usageCount > 0
            ? <span className="text-slate-600">已被 <span className="font-semibold">{template.usageCount}</span> 個職位使用</span>
            : "暫無職位使用"}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export function ShiftTemplatesPage() {
  const [templates, setTemplates] = useState<ShiftTemplate[]>(INITIAL);
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<ShiftTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSave = (data: Omit<ShiftTemplate, "id" | "usageCount">) => {
    if (editTarget) {
      setTemplates(prev => prev.map(t => t.id === editTarget.id ? { ...t, ...data } : t));
    } else {
      setTemplates(prev => [...prev, { ...data, id: `ST-${String(prev.length+1).padStart(3,"0")}`, usageCount: 0 }]);
    }
  };

  const handleDuplicate = (t: ShiftTemplate) => {
    const copy: ShiftTemplate = {
      ...t,
      id: `ST-${String(templates.length+1).padStart(3,"0")}`,
      name: `${t.name}（副本）`,
      usageCount: 0,
    };
    setTemplates(prev => [...prev, copy]);
  };

  const totalWeeklyHours = templates.reduce((s, t) => s + calcWeeklyHours(t), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">班次管理</h1>
              <p className="text-sm text-slate-500 mt-0.5">建立可複用的班次模板，發布職位時快速套用</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => { setEditTarget(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-4 h-4" />新增模板
              </Button>
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "模板總數",    value: templates.length,                                           color: "bg-white border-slate-200 text-slate-900" },
              { label: "按週統一",    value: templates.filter(t => t.type === "weekly").length,          color: "bg-blue-50 border-blue-200 text-blue-800" },
              { label: "每天自訂",    value: templates.filter(t => t.type === "custom").length,          color: "bg-violet-50 border-violet-200 text-violet-800" },
            ].map(c => (
              null
            ))}
          </div>

          {/* Info banner */}
          

          {/* Templates grid */}
          {templates.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
              <Clock className="w-10 h-10 text-slate-300" />
              <p className="text-sm">暫無班次模板，點擊右上角「新增模板」開始建立</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => { setEditTarget(t); setShowForm(true); }}
                  onDuplicate={() => handleDuplicate(t)}
                  onDelete={() => setDeleteTarget(t.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Form dialog */}
      {showForm && (
        <TemplateForm
          existing={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={d => { handleSave(d); setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <DialogTitle className="text-base font-semibold text-slate-900 mb-2">確認刪除此班次模板？</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">此操作不可撤銷。</DialogDescription>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setTemplates(prev => prev.filter(t => t.id !== deleteTarget)); setDeleteTarget(null); }}>確認刪除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
