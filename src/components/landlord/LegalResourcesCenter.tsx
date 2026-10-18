import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../lib/store';
import { US_STATES_LIST, STATE_PROFILES } from '../../lib/statesData';
import { LEGAL_TOPICS } from '../../lib/legalResourcesData';
import { LegalResource, VerificationStatus } from '../../types';
import {
  Scale,
  Search,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  Archive,
  AlertCircle,
  FileText,
  Building,
  Shield,
  Filter
} from 'lucide-react';

export const LegalResourcesCenter: React.FC = () => {
  const { t, lang } = useI18n();
  const { legalResources, toggleBookmarkResource, properties } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  // Landlord's active portfolio states
  const activePortfolioStates = Array.from(new Set(properties.map(p => p.state)));

  const filteredResources = legalResources.filter(res => {
    // Search keyword
    const matchesSearch =
      !searchQuery ||
      res.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.titleZh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summaryEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summaryZh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.citationText?.toLowerCase().includes(searchQuery.toLowerCase());

    // State filter
    const matchesState =
      selectedState === 'ALL' ||
      res.jurisdictionId === selectedState ||
      (selectedState !== 'FEDERAL' && res.jurisdictionId === 'FEDERAL');

    // Topic filter
    const matchesTopic = selectedTopic === 'ALL' || res.topicId === selectedTopic;

    // Bookmarked filter
    const matchesBookmark = !onlyBookmarked || res.isBookmarked;

    return matchesSearch && matchesState && matchesTopic && matchesBookmark;
  });

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('verifiedBadge')}
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {t('pendingReviewBadge')}
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            <Archive className="w-3.5 h-3.5 text-slate-500" />
            {t('archivedBadge')}
          </span>
        );
    }
  };

  const selectedStateProfile = selectedState !== 'ALL' && selectedState !== 'FEDERAL' ? STATE_PROFILES[selectedState] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {t('legalCenterTitle')}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              50 States + D.C.
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl">
            {t('legalCenterSubtitle')}
          </p>
        </div>

        {/* Quick portfolio states shortcuts */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <span className="font-semibold text-slate-600 px-2">
            {lang === 'zh' ? '在管房源州:' : 'My States:'}
          </span>
          {activePortfolioStates.map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                selectedState === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={() => setSelectedState('FEDERAL')}
            className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
              selectedState === 'FEDERAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {lang === 'zh' ? '联邦' : 'Fed'}
          </button>
        </div>
      </div>

      {/* Prominent Legal Disclaimer Banner (Required in Section 27 & 30) */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 text-xs leading-relaxed flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-900 block text-sm mb-0.5">
            {t('legalDisclaimerHeader')}
          </strong>
          {t('legalDisclaimerText')}
        </div>
      </div>

      {/* State Quick Rule Card (if state selected) */}
      {selectedStateProfile && (
        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                {lang === 'zh' ? '州别基线速查' : 'STATE STATUTORY RULES'}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedStateProfile.name} ({selectedStateProfile.code}) Landlord-Tenant Overview
              </h2>
            </div>
            <a
              href={selectedStateProfile.officialTenantRightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>{lang === 'zh' ? '官方住房署门户' : 'Official Agency Portal'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px] font-medium">{lang === 'zh' ? '押金上限' : 'Deposit Limit'}</span>
              <strong className="text-slate-900 mt-1 block">{selectedStateProfile.depositLimitSummary}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px] font-medium">{lang === 'zh' ? '押金退还期限' : 'Deposit Return'}</span>
              <strong className="text-slate-900 mt-1 block tabular-nums">
                {selectedStateProfile.depositReturnDays} {lang === 'zh' ? '天内必须返还' : 'days max'}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px] font-medium">{lang === 'zh' ? '进屋通知要求' : 'Entry Notice'}</span>
              <strong className="text-slate-900 mt-1 block tabular-nums">
                {selectedStateProfile.entryNoticeHours} {lang === 'zh' ? '小时提前通知' : 'hours advance'}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 block text-[11px] font-medium">{lang === 'zh' ? '迟交费安全港' : 'Late Fee Safe Harbor'}</span>
              <strong className="text-slate-900 mt-1 block">{selectedStateProfile.lateFeeSummary}</strong>
            </div>
          </div>

          {selectedStateProfile.specialDisclosures.length > 0 && (
            <div className="pt-2 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                {lang === 'zh' ? '该州法定强制披露与附件清单:' : 'Mandatory State Disclosures:'}
              </span>
              <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                {selectedStateProfile.specialDisclosures.map((disc, idx) => (
                  <li key={idx}>{disc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Multi-Dimensional Search & Filters Toolbar (Section 27.1) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* State Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">{t('allStates')}</option>
              <option value="FEDERAL">Federal / 联邦法规</option>
              {US_STATES_LIST.map(st => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="ALL">{t('allTopics')}</option>
              {LEGAL_TOPICS.map(top => (
                <option key={top.id} value={top.id}>
                  {lang === 'zh' ? top.nameZh : top.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Bookmarked Filter Button */}
          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              onlyBookmarked
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{lang === 'zh' ? '已收藏' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Resources Results List */}
      <div className="space-y-4">
        {filteredResources.map(resource => (
          <div
            key={resource.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {resource.jurisdictionName}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {lang === 'zh' ? resource.topicNameZh : resource.topicNameEn}
                  </span>
                  <span className="text-slate-300">·</span>
                  {getVerificationBadge(resource.verificationStatus)}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {lang === 'zh' ? resource.titleZh : resource.titleEn}
                </h3>
              </div>

              {/* Bookmark & Citation */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => toggleBookmarkResource(resource.id)}
                  className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Bookmark statute"
                >
                  <Bookmark
                    className={`w-4 h-4 ${resource.isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                </button>

                <a
                  href={resource.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <span>{t('viewOfficialSite')}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'zh' ? resource.summaryZh : resource.summaryEn}
            </p>

            {/* Source Agency, Citation & Verification dates */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  {t('agency')}: <strong className="text-slate-700">{resource.officialAgency}</strong>
                </span>
                {resource.citationText && (
                  <span className="font-mono text-slate-600">
                    [{resource.citationText}]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 tabular-nums">
                <span>{t('verifiedOn')}: {resource.verifiedAt}</span>
                <span>·</span>
                <span>{lang === 'zh' ? '最后巡检: ' : 'Checked: '}{resource.lastCheckedAt}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredResources.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            {lang === 'zh' ? '未找到符合条件的法规资源。请尝试更换关键词或清除筛选。' : 'No legal resources found matching your search. Try resetting filters.'}
          </div>
        )}
      </div>
    </div>
  );
};
