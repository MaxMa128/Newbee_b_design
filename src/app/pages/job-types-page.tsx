import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, Briefcase, AlertTriangle } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog";

interface JobType {
  id: string;
  name: string;
  hiringType: "全職" | "兼職" | "臨時工";
  rateType: "時薪" | "月薪";
  rate: number;
  description?: string;
  employeeCount: number;
}

const HIRING_COLORS: Record<JobType["hiringType"], string> = {
  "全職":   "bg-blue-50 text-blue-700 border-blue-200",
  "兼職":   "bg-indigo-50 text-indigo-700 border-indigo-200",
  "臨時工": "bg-violet-50 text-violet-700 border-violet-200",
};

const INITIAL: JobType[] = [
  { id: "JT-001", name: "收銀員",   hiringType: "兼職",   rateType: "時薪", rate: 65,    description: "負責收銀台操作及客戶服務，需具備細心及服務態度", employeeCount: 3 },
  { id: "JT-002", name: "倉務員",   hiringType: "兼職",   rateType: "時薪", rate: 70,    description: "負責倉庫收發貨及庫存管理，需具備基本體力",       employeeCount: 2 },
  { id: "JT-003", name: "侍應生",   hiringType: "臨時工", rateType: "時薪", rate: 70,    description: "餐廳桌面服務及客戶接待，需具備廣東話溝通能力",   employeeCount: 4 },
  { id: "JT-004", name: "推廣員",   hiringType: "臨時工", rateType: "時薪", rate: 65,    description: "品牌推廣及現場活動執行，需形象端莊、具親和力",   employeeCount: 2 },
  { id: "JT-005", name: "客服代表", hiringType: "全職",   rateType: "月薪", rate: 18000, description: "處理客戶查詢及投訴跟進，需具備流利廣普英語",     employeeCount: 1 },
  { id: "JT-006", name: "清潔員",   hiringType: "兼職",   rateType: "時薪", rate: 58,    description: "辦公室及商場日常清潔工作",                       employeeCount: 0 },
];

// Exported for use in other pages
export const JOB_TYPES_LIST = INITIAL;

function JobTypeForm({ existing, onClose, onSave }: {
  existing: JobType | null;
  onClose: () => void;
  onSave: (d: Omit<JobType, "id" | "employeeCount">) => void;
}) {
  const [name, setName]             = useState(existing?.name ?? "");
  const [hiringType, setHiringType] = useState<JobType["hiringType"]>(existing?.hiringType ?? "兼職");
  const [rateType, setRateType]     = useState<"時薪" | "月薪">(existing?.rateType ?? "時薪");
  const [rate, setRate]             = useState(existing?.rate?.toString() ?? "");
  const [desc, setDesc]             = useState(existing?.description ?? "");
  const ok = name.trim() && rate && +rate > 0;
  const cls = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <DialogTitle className="text-base font-semibold text-slate-900">{existing ? "編輯工種" : "新增工種"}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-0.5">定義員工職位類型及對應薪酬標準</DialogDescription>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">工種名稱 <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例：收銀員、侍應生" className={cls} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">工種類型 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(["全職", "兼職", "臨時工"] as const).map(ht => (
                <button key={ht} type="button" onClick={() => setHiringType(ht)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${hiringType === ht ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {ht}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">薪酬類型 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(["時薪", "月薪"] as const).map(rt => (
                <button key={rt} type="button" onClick={() => setRateType(rt)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${rateType === rt ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {rt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">參考薪資 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-sm text-slate-400 pointer-events-none">HK$</span>
                <input type="number" min={0} value={rate} onChange={e => setRate(e.target.value)}
                  placeholder={rateType === "時薪" ? "每小時薪資" : "每月薪資"} className={`${cls} pl-10`} />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{rateType === "時薪" ? "/ 小時" : "/ 月"}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">職位描述 <span className="text-slate-400 font-normal">（選填）</span></label>
            <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="簡單描述此工種的職責範圍…" className={`${cls} resize-none`} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={!ok}
            onClick={() => { onSave({ name, hiringType, rateType, rate: +rate, description: desc }); onClose(); }}>
            {existing ? "儲存修改" : "新增工種"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function JobTypesPage() {
  const [jobTypes, setJobTypes]         = useState<JobType[]>(INITIAL);
  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<JobType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSave = (d: Omit<JobType, "id" | "employeeCount">) => {
    if (editTarget) {
      setJobTypes(prev => prev.map(jt => jt.id === editTarget.id ? { ...jt, ...d } : jt));
    } else {
      setJobTypes(prev => [...prev, { ...d, id: `JT-${String(prev.length+1).padStart(3,"0")}`, employeeCount: 0 }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div><h1 className="text-xl font-semibold text-slate-900">工種管理</h1><p className="text-sm text-slate-500 mt-0.5">定義員工職位類型及對應薪酬標準</p></div>
            <div className="flex items-center gap-3">
              <Button onClick={() => { setEditTarget(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                <Plus className="w-4 h-4" />新增工種
              </Button>
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "工種總數", value: jobTypes.length,                                           color: "bg-white border-slate-200 text-slate-900" },
              { label: "全職工種", value: jobTypes.filter(j => j.hiringType === "全職").length,      color: "bg-blue-50 border-blue-200 text-blue-800" },
              { label: "在職員工", value: `${jobTypes.reduce((s, j) => s + j.employeeCount, 0)} 人`, color: "bg-green-50 border-green-200 text-green-800" },
            ].map(c => (
              <div key={c.label} className={`rounded-xl p-4 border ${c.color}`}>
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-sm mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>

          {jobTypes.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
              <Briefcase className="w-10 h-10 text-slate-300" />
              <p className="text-sm">暫無工種記錄，點擊右上角「新增工種」開始建立</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobTypes.map(jt => (
                <div key={jt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <div className="text-base font-semibold text-slate-900">{jt.name}</div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${HIRING_COLORS[jt.hiringType]}`}>{jt.hiringType}</span>
                      </div>
                      {jt.description && <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{jt.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditTarget(jt); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(jt.id)} disabled={jt.employeeCount > 0} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">參考薪資</div>
                      <div className="text-sm font-semibold text-slate-900 tabular-nums">HK$ {jt.rate.toLocaleString()}</div>
                    </div>
                    <span className="text-xs text-slate-400">{jt.rateType === "時薪" ? "/ 小時" : "/ 月"}</span>
                  </div>
                  <div className="text-xs text-slate-500 pt-1">
                    在職員工：<span className="font-semibold text-slate-800">{jt.employeeCount}</span> 人
                    {jt.employeeCount > 0 && <span className="text-slate-400 ml-1.5">（有在職員工，無法刪除）</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showForm && <JobTypeForm existing={editTarget} onClose={() => { setShowForm(false); setEditTarget(null); }} onSave={d => { handleSave(d); setShowForm(false); setEditTarget(null); }} />}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <DialogTitle className="text-base font-semibold text-slate-900 mb-2">確認刪除此工種？</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">此操作不可撤銷。</DialogDescription>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setJobTypes(prev => prev.filter(j => j.id !== deleteTarget)); setDeleteTarget(null); }}>確認刪除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
