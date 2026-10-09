// Shared design tokens — aligned with Billing.tsx visual language.
// Import these in any feature component to keep the UI consistent.

// ─── Page layout ──────────────────────────────────────────────────────────────
export const pageCls       = 'w-full min-h-screen bg-slate-50 font-sans text-slate-800 antialiased p-8';
export const pageInnerCls  = 'max-w-[1150px] mx-auto';
export const pageTitleCls  = 'text-2xl font-bold text-slate-900';
export const pageSubCls    = 'text-sm text-slate-500 mt-0.5';

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const btnPrimary   = 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-100';
export const btnSecondary = 'flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm';
export const btnDanger    = 'px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm';
export const btnCancel    = 'px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors';
export const btnSubmit    = 'px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2';

// ─── Form fields ──────────────────────────────────────────────────────────────
export const inputCls  = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
export const selectCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer';
export const labelCls  = 'block text-xs font-semibold text-slate-500 mb-1.5';

// ─── Card / panel ─────────────────────────────────────────────────────────────
export const cardCls    = 'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden';
export const kpiCardCls = 'bg-white p-5 rounded-2xl border border-slate-100 shadow-sm';

// ─── Table ────────────────────────────────────────────────────────────────────
export const tableHeadRowCls  = 'border-b border-slate-100 text-[11px] font-semibold tracking-wider text-slate-400 uppercase bg-slate-50/50';
export const tableThCls       = 'p-4 font-semibold';
export const tableBodyCls     = 'divide-y divide-slate-100 text-xs font-medium text-slate-700';
export const tableRowCls      = 'hover:bg-slate-50/70 transition-colors group';
export const tableTdCls       = 'p-4';
export const tableToolbarCls  = 'p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100';
export const tablePaginationCls = 'p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500';

// ─── Tab switcher ─────────────────────────────────────────────────────────────
export const tabBarCls      = 'flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50';
export const tabActiveCls   = 'flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow-sm transition-all';
export const tabInactiveCls = 'flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all';

// ─── Filter pill bar (inside table toolbar) ───────────────────────────────────
export const filterBarCls      = 'flex bg-slate-50 p-1 rounded-xl border border-slate-200/50 w-full sm:w-auto';
export const filterActiveCls   = 'px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm transition-all';
export const filterInactiveCls = 'px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all';

// ─── Search input (icon slot: add relative wrapper + icon absolutely) ─────────
export const searchInputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

// ─── Modal ────────────────────────────────────────────────────────────────────
export const modalOverlayCls = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4';
export const modalBoxCls     = 'bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden';
export const modalHeaderCls  = 'p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50';
export const modalBodyCls    = 'p-6 space-y-4';
export const modalFooterCls  = 'p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-2';

// ─── Status badge base (apply color classes inline per status) ────────────────
export const badgeCls = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold';

// ─── Error / alert banner ─────────────────────────────────────────────────────
export const errorBannerCls = 'flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl';
