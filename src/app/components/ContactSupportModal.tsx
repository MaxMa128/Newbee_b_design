import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Placeholder QR code — replace with real WhatsApp QR image asset when available
function WhatsAppQR() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="26" height="26" rx="2" fill="#1a1a1a" />
      <rect x="5" y="5" width="20" height="20" rx="1" fill="white" />
      <rect x="8" y="8" width="14" height="14" rx="1" fill="#1a1a1a" />
      <rect x="72" y="2" width="26" height="26" rx="2" fill="#1a1a1a" />
      <rect x="75" y="5" width="20" height="20" rx="1" fill="white" />
      <rect x="78" y="8" width="14" height="14" rx="1" fill="#1a1a1a" />
      <rect x="2" y="72" width="26" height="26" rx="2" fill="#1a1a1a" />
      <rect x="5" y="75" width="20" height="20" rx="1" fill="white" />
      <rect x="8" y="78" width="14" height="14" rx="1" fill="#1a1a1a" />
      {[34,38,42,46,50,54,58,62,66].map((x, i) => (
        [34,38,42,46,50,54,58,62,66].map((y, j) => (
          (i + j) % 3 !== 0 && (
            <rect key={`${i}-${j}`} x={x} y={y} width="3" height="3" fill="#1a1a1a" />
          )
        ))
      ))}
      <rect x="34" y="72" width="3" height="3" fill="#1a1a1a" />
      <rect x="42" y="76" width="3" height="3" fill="#1a1a1a" />
      <rect x="50" y="72" width="3" height="3" fill="#1a1a1a" />
      <rect x="38" y="80" width="3" height="3" fill="#1a1a1a" />
      <rect x="54" y="80" width="3" height="3" fill="#1a1a1a" />
      <rect x="58" y="76" width="3" height="3" fill="#1a1a1a" />
      <rect x="62" y="72" width="3" height="3" fill="#1a1a1a" />
      <rect x="66" y="80" width="3" height="3" fill="#1a1a1a" />
      <rect x="72" y="34" width="3" height="3" fill="#1a1a1a" />
      <rect x="76" y="42" width="3" height="3" fill="#1a1a1a" />
      <rect x="80" y="38" width="3" height="3" fill="#1a1a1a" />
      <rect x="84" y="50" width="3" height="3" fill="#1a1a1a" />
      <rect x="88" y="34" width="3" height="3" fill="#1a1a1a" />
      <rect x="92" y="46" width="3" height="3" fill="#1a1a1a" />
      <rect x="76" y="58" width="3" height="3" fill="#1a1a1a" />
      <rect x="84" y="62" width="3" height="3" fill="#1a1a1a" />
      <rect x="92" y="54" width="3" height="3" fill="#1a1a1a" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 text-slate-400 hover:text-slate-600 transition-colors"
      title="複製"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const SUPPORT_EMAIL = "support@newbee.hk";

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogDescription className="sr-only">聯絡客服</DialogDescription>
      <DialogContent className="max-w-xs p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 text-center">
          <DialogTitle className="text-base font-semibold text-slate-900">聯絡客服</DialogTitle>
        </div>

        <div className="px-6 py-6 flex flex-col items-center space-y-5">
          {/* WhatsApp QR */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="text-sm font-medium text-slate-800">WhatsApp</span>
            </div>
            <div className="w-36 h-36 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <WhatsAppQR />
            </div>
            <p className="text-xs text-slate-500">掃描二維碼添加 WhatsApp 聯絡</p>
          </div>

          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-slate-400">或</span>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-800">電郵</span>
            </div>
            <div className="flex items-center">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {SUPPORT_EMAIL}
              </a>
              <CopyButton text={SUPPORT_EMAIL} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
