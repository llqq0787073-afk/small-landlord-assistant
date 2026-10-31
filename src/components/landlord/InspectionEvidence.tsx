import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { Inspection, InspectionItem, RoomCondition } from '../../types';
import { ScheduleInspectionModal } from '../modals/ScheduleInspectionModal';
import {
  FileCheck,
  ShieldCheck,
  Camera,
  Hash,
  Clock,
  MapPin,
  Download,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Columns,
  X
} from 'lucide-react';

export const InspectionEvidence: React.FC = () => {
  const { t, lang } = useI18n();
  const { inspections, updateInspectionItem, signInspection, currentUser, currentRole } = useAppStore();
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>(inspections[0]?.id || '');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [signatureName, setSignatureName] = useState<string>(currentUser.name);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const currentInspection = inspections.find(i => i.id === selectedInspectionId) || inspections[0];
  const inspectionLocked = !!(currentInspection?.landlordSigned && currentInspection?.tenantSigned);

  const handleConditionChange = (itemId: string, newCondition: RoomCondition) => {
    if (!currentInspection || inspectionLocked) return;
    const item = currentInspection.items.find(i => i.id === itemId);
    if (!item) return;

    const wearCat = newCondition === 'damaged' ? 'potential_damage' : 'normal_wear';
    updateInspectionItem(currentInspection.id, itemId, newCondition, item.notes, wearCat);
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    if (!currentInspection || inspectionLocked) return;
    const item = currentInspection.items.find(i => i.id === itemId);
    if (!item) return;
    updateInspectionItem(currentInspection.id, itemId, item.condition, notes, item.wearTearCategory);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t('inspectionsTitle')}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {lang === 'zh' ? '种子示例图：哈希不作为真实证据' : 'Seed sample images: hashes are not real evidence'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl">
            {t('inspectionsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScheduleOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
          >
            <span>{t('scheduleInspectionTitle')}</span>
          </button>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              compareMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>{t('compareMoveInOut')}</span>
          </button>

          <button
            onClick={() => setPdfModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportPdfReport')}</span>
          </button>
        </div>
      </div>

      {/* Legal & Evidence Disclaimer Banner (Required in Section 10) */}
      <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-900 block mb-0.5">
            {lang === 'zh' ? '照片防篡改与法定存证声明' : 'Objective Photo Evidence & Legal Standard'}
          </strong>
          {t('inspectionDisclaimer')}
        </div>
      </div>

      {/* Inspection Header Details */}
      {currentInspection && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentInspection.type === 'move_in' ? t('moveIn') : t('moveOut')}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-mono">
                  Unit 2B (Elmwood Townhomes) · Version {currentInspection.version}.0
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {lang === 'zh' ? '2B 单元入住验收与原始照片留存' : 'Unit 2B Initial Move-In Photographic Baseline'}
              </h2>
            </div>

            {/* Dual Digital Signatures Status */}
            <div className="flex items-center gap-3 text-xs">
              {/* Landlord sign */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('landlordSignOff')}</span>
                {currentInspection.landlordSigned ? (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentInspection.landlordSignatureName}</span>
                  </div>
                ) : currentRole === 'landlord' ? (
                  <button
                    onClick={() => signInspection(currentInspection.id, 'landlord', currentUser.name)}
                    className="text-indigo-600 font-semibold hover:underline mt-0.5 min-h-[44px]"
                  >
                    {lang === 'zh' ? '点击电子签署' : 'Click to Sign'}
                  </button>
                ) : (
                  <span className="text-slate-500 mt-0.5 block">{lang === 'zh' ? '等待房东签署' : 'Waiting for landlord'}</span>
                )}
              </div>

              {/* Tenant sign */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">{t('tenantSignOff')}</span>
                {currentInspection.tenantSigned ? (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentInspection.tenantSignatureName}</span>
                  </div>
                ) : currentRole === 'tenant' ? (
                  <button
                    onClick={() => signInspection(currentInspection.id, 'tenant', currentUser.name)}
                    className="text-indigo-600 font-semibold hover:underline mt-0.5 min-h-[44px]"
                  >
                    {lang === 'zh' ? '点击电子签署' : 'Click to Sign'}
                  </button>
                ) : (
                  <span className="text-slate-500 mt-0.5 block">{lang === 'zh' ? '等待租客签署' : 'Waiting for tenant'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Inspection Items Checklist */}
          <div className="divide-y divide-slate-100 mt-4">
            {currentInspection.items.map((item, idx) => (
              <div key={item.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">
                      {idx + 1}. {item.roomName}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {item.itemKey}
                    </h3>
                  </div>

                  {/* Condition Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['excellent', 'good', 'fair', 'damaged'] as RoomCondition[]).map(cond => (
                      <button
                        key={cond}
                        disabled={inspectionLocked}
                        onClick={() => handleConditionChange(item.id, cond)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          item.condition === cond
                            ? cond === 'damaged'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t(cond)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <input
                  type="text"
                  value={item.notes}
                  disabled={inspectionLocked}
                  onChange={e => handleNotesChange(item.id, e.target.value)}
                  placeholder="Notes on scratches, cleanliness, or operational state..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />

                {/* Evidence Files (Photos with Hash & Server Timestamp) */}
                {item.evidenceFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {lang === 'zh' ? '照片证据与防伪指纹' : 'Attached Photographic Evidence'}
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.evidenceFiles.map(file => (
                        <div
                          key={file.id}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-3 text-xs"
                        >
                          {/* Photo preview with zero-broken-image fallback container */}
                          <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                            <img
                              src={file.url}
                              alt={file.fileName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <Camera className="w-5 h-5 text-slate-400 absolute" />
                          </div>

                          {/* Cryptographic Metadata */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-slate-900 truncate font-mono text-[11px]">
                                {file.fileName}
                              </strong>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                {(file.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>

                            {/* SHA-256 Digest */}
                            <div className="flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded font-mono truncate">
                              <Hash className="w-3 h-3 shrink-0" />
                              <span className="truncate" title={file.sha256Hash}>
                                SHA-256: {file.sha256Hash}
                              </span>
                            </div>

                            {/* Server Timestamp & EXIF */}
                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {file.serverReceivedAt.replace('T', ' ').replace('Z', '')}
                              </span>
                              {file.exifGpsNote && (
                                <span className="flex items-center gap-1 truncate" title={file.exifGpsNote}>
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  GPS Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Drawer/View if activated */}
      {compareMode && (
        <div className="bg-indigo-950 text-white rounded-xl p-6 border border-indigo-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Columns className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">
                {lang === 'zh' ? '入住 (Move-In) 与 退租 (Move-Out) 并排对比取证' : 'Side-by-Side Move-In vs Move-Out Comparison'}
              </h3>
            </div>
            <button
              onClick={() => setCompareMode(false)}
              className="text-xs text-indigo-300 hover:text-white"
            >
              {t('close')}
            </button>
          </div>

          <p className="text-xs text-indigo-200">
            {lang === 'zh'
              ? '对比同一区域或设备在入住初期的 baseline 与退租时的照片与记录，明确正常磨损与需扣除押金的人为损坏。'
              : 'Compare initial photographic baseline against final condition to objectively audit wear-and-tear vs damage.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Move In Column */}
            <div className="bg-indigo-900/60 p-4 rounded-xl border border-indigo-800 space-y-3">
              <span className="text-xs uppercase font-bold text-emerald-400 block">
                [Move-In Baseline] 2025-10-31
              </span>
              <div className="h-40 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80"
                  alt="Kitchen Move In"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                  SHA-256: e3b0c442...
                </span>
              </div>
              <p className="text-indigo-100">
                <strong>Kitchen Countertops:</strong> Excellent condition. Granite clean with zero cracks.
              </p>
            </div>

            {/* Move Out Current/Projected Column */}
            <div className="bg-indigo-900/60 p-4 rounded-xl border border-indigo-800 space-y-3">
              <span className="text-xs uppercase font-bold text-amber-400 block">
                [Move-Out Inspection] 2026-10-18 (Current State)
              </span>
              <div className="h-40 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80"
                  alt="Kitchen Move Out"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
                  Pending Move-Out Walkthrough
                </span>
              </div>
              <p className="text-indigo-100">
                <strong>Current Condition:</strong> Normal wear. Minor water faucet leak was reported and repaired under WO-2026-089.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Inspection Report Modal */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {lang === 'zh' ? '房屋检查与照片证据索引报告 (PDF 预览)' : 'Inspection & Photo Evidence Certificate (PDF Preview)'}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Report ID: SLA-INSP-2025-2B · Hash Authenticated
                </span>
              </div>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block">{lang === 'zh' ? '租赁物业与单元' : 'Property & Unit'}</span>
                  <strong className="text-slate-900">Elmwood Townhomes, Unit 2B (Bethesda MD)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{lang === 'zh' ? '检查类型与时间' : 'Inspection Type & Date'}</span>
                  <strong className="text-slate-900">Move-In Baseline · 2025-10-31</strong>
                </div>
              </div>

              {/* Items Summary Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">{lang === 'zh' ? '检查项目记录清单' : 'Room Checklist & Human Notes'}</h4>
                <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 text-left">
                  <thead className="bg-slate-100 font-semibold text-slate-800">
                    <tr>
                      <th className="p-2 border-b">{t('roomCategory')}</th>
                      <th className="p-2 border-b">{t('condition')}</th>
                      <th className="p-2 border-b">{lang === 'zh' ? '证据哈希' : 'SHA-256 Digest'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {currentInspection.items.map(it => (
                      <tr key={it.id}>
                        <td className="p-2 font-sans font-medium text-slate-900">{it.itemKey}</td>
                        <td className="p-2 font-sans capitalize">{it.condition}</td>
                        <td className="p-2 text-indigo-700 truncate max-w-[200px]">
                          {it.evidenceFiles[0]?.sha256Hash || 'N/A (Visual pass)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Legal Disclaimer Box in PDF */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Legal Compliance Notice:</strong> {t('inspectionDisclaimer')}
              </div>

              {/* Signatures Lock Box */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('landlordSignOff')}</span>
                  <span className="font-semibold text-slate-900 block mt-1">{currentInspection.landlordSignatureName || (lang === 'zh' ? '未签署' : 'Not signed')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{currentInspection.landlordSignedAt || ''}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('tenantSignOff')}</span>
                  <span className="font-semibold text-slate-900 block mt-1">{currentInspection.tenantSignatureName || (lang === 'zh' ? '未签署' : 'Not signed')}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{currentInspection.tenantSignedAt || ''}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPdfModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                {t('close')}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'zh' ? '打印 / 另存为 PDF' : 'Print / Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {scheduleOpen && (
        <ScheduleInspectionModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
        />
      )}
    </div>
  );
};
