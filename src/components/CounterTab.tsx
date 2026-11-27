import React, { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Compass,
  Minus,
  Plus,
  QrCode,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  AppState,
  BillLine,
  KiranaItem,
  PaymentMethod,
} from '../engine/types';

interface CounterTabProps {
  state: AppState;
  onQuickAddItem: (item: KiranaItem, qty: number, orderedByRupees?: number) => void;
  onAdjustLineQty: (lineId: string, delta: number) => void;
  onRemoveLine: (lineId: string) => void;
  onClearBill: () => void;
  onCheckout: (method: PaymentMethod, customerId?: string) => void;
  onCreateCustomerAndCheckout: (name: string, phone: string) => void;
  onNavigateTab: (tab: 'stock' | 'refill' | 'udhaar' | 'profit') => void;
  onOpenQuickTour: () => void;
}

export function CounterTab({
  state,
  onQuickAddItem,
  onAdjustLineQty,
  onRemoveLine,
  onClearBill,
  onCheckout,
  onCreateCustomerAndCheckout,
  onNavigateTab,
  onOpenQuickTour,
}: CounterTabProps) {
  const [showTabPicker, setShowTabPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonError, setNewPersonError] = useState('');

  const billTotal = state.activeBill.reduce((sum, l) => sum + l.lineTotal, 0);
  const totalTaruguGrams = Math.round(
    state.activeBill
      .filter((l) => l.isLoose && l.unit === 'kg')
      .reduce((sum, l) => sum + l.taruguQty * 1000, 0)
  );

  const filteredCustomers = state.udhaarAccounts.filter((acc) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      acc.name.toLowerCase().includes(q) || acc.phone.toLowerCase().includes(q)
    );
  });

  const handleSelectTabPerson = (customerId: string) => {
    onCheckout('udhaar', customerId);
    setShowTabPicker(false);
    setCustomerSearch('');
    setShowNewPerson(false);
  };

  const handleCreateAndBillPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newPersonName.trim();
    if (!cleaned) {
      setNewPersonError('Enter the customer name.');
      return;
    }
    onCreateCustomerAndCheckout(cleaned, newPersonPhone.trim() || '+91 90000 00000');
    setNewPersonName('');
    setNewPersonPhone('');
    setNewPersonError('');
    setShowNewPerson(false);
    setShowTabPicker(false);
  };

  const renderLineMeta = (line: BillLine) => {
    const parts: string[] = [];
    if (line.orderedByRupees) {
      parts.push(`₹${line.orderedByRupees} order → ${line.displayQty}`);
    } else {
      parts.push(`${line.displayQty} × ₹${line.unitPrice}/${line.unit}`);
    }
    if (line.isLoose && line.taruguQty > 0) {
      const taruguG = Math.max(1, Math.round(line.taruguQty * 1000));
      parts.push(`+1.5% tarugu (${taruguG}g drum buffer)`);
    }
    return parts.join(' · ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Cols: Live Counter Receipt & Checkout Controls */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="bg-white rounded-[24px] p-6 sm:p-7 border border-black/[0.06]">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-black/[0.06]">
            <div>
              <p className="text-xs font-semibold text-[#6E6E73]">
                Live Rush-Hour Bill · Auto 1.5% Tarugu Tracking
              </p>
              <div className="mt-1 flex items-baseline gap-3">
                <span
                  data-testid="active-bill-total"
                  className="font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#1D1D1F]"
                >
                  ₹{billTotal.toLocaleString('en-IN')}
                </span>
                {state.activeBill.length > 0 && (
                  <span className="text-sm font-medium text-[#6E6E73] tabular-nums">
                    {state.activeBill.length}{' '}
                    {state.activeBill.length === 1 ? 'item' : 'items'}
                    {totalTaruguGrams > 0 ? ` · +${totalTaruguGrams}g tarugu` : ''}
                  </span>
                )}
              </div>
            </div>

            {state.activeBill.length > 0 && (
              <button
                type="button"
                onClick={onClearBill}
                className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-[#6E6E73] hover:text-[#DC2626] rounded-xl hover:bg-black/[0.04] transition-colors whitespace-nowrap"
              >
                Clear Bill
              </button>
            )}
          </div>

          {/* Receipt Lines or Ready State */}
          {state.activeBill.length === 0 ? (
            <div className="py-8">
              {state.lastBillSummary ? (
                <div
                  data-testid="last-bill-banner"
                  className="rounded-2xl bg-[#F5F5F7] p-5 space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#0F766E] font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      Checked Out · ₹{state.lastBillSummary.total.toLocaleString('en-IN')}{' '}
                      {state.lastBillSummary.method === 'udhaar' && state.lastBillSummary.customerName
                        ? `logged to ${state.lastBillSummary.customerName} Tab`
                        : `via ${state.lastBillSummary.method.toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-sm text-[#6E6E73]">
                    Drum stock deducted with 1.5% tarugu buffer. Screen reset hands-free for next customer.
                  </p>
                  {state.lastBillSummary.warning && (
                    <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#DC2626] flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{state.lastBillSummary.warning}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('refill')}
                        className="text-xs font-bold text-[#0F766E] hover:underline whitespace-nowrap shrink-0"
                      >
                        View Refill List
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="font-display text-lg font-bold text-[#1D1D1F]">
                    Ready for next customer
                  </p>
                  <p className="mt-1.5 text-sm text-[#6E6E73] max-w-md mx-auto">
                    Speak items in Telugu, Hindi, or English and say{' '}
                    <span className="font-semibold text-[#1D1D1F]">“Checkout”</span> — or tap
                    items in Quick Counter Tap on the right.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ul
              data-testid="active-bill-lines"
              className="divide-y divide-black/[0.06] my-2"
            >
              {state.activeBill.map((line) => (
                <li
                  key={line.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-[#1D1D1F] flex flex-wrap items-baseline gap-x-2">
                      <span>{line.itemName}</span>
                      <span className="font-mono text-base font-semibold text-[#0F766E] tabular-nums whitespace-nowrap">
                        {line.displayQty}
                      </span>
                    </p>
                    <p className="text-xs text-[#6E6E73] mt-0.5 tabular-nums">
                      {renderLineMeta(line)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <div className="flex items-center bg-[#F5F5F7] rounded-xl p-0.5">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.itemName} quantity`}
                        onClick={() =>
                          onAdjustLineQty(line.id, line.unit === 'packet' ? -1 : -0.25)
                        }
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[#1D1D1F] hover:bg-white transition-colors"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Increase ${line.itemName} quantity`}
                        onClick={() =>
                          onAdjustLineQty(line.id, line.unit === 'packet' ? 1 : 0.25)
                        }
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[#1D1D1F] hover:bg-white transition-colors"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold tabular-nums text-[#1D1D1F] sm:w-20 text-right">
                        ₹{line.lineTotal}
                      </span>

                      <button
                        type="button"
                        aria-label={`Remove ${line.itemName} from bill`}
                        onClick={() => onRemoveLine(line.id)}
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Checkout Controls */}
          <div className="pt-5 mt-2 border-t border-black/[0.06]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={state.activeBill.length === 0}
                onClick={() => onCheckout('cash')}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-black/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Banknote className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                <span>Cash Checkout</span>
              </button>
              <button
                type="button"
                disabled={state.activeBill.length === 0}
                onClick={() => onCheckout('upi')}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-black/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <QrCode className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                <span>UPI Checkout</span>
              </button>
              <button
                type="button"
                disabled={state.activeBill.length === 0}
                onClick={() => {
                  setCustomerSearch('');
                  setShowNewPerson(false);
                  setShowTabPicker(true);
                }}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-[#0F766E] text-white font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-[#115E59] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <BookOpenCheck className="w-4 h-4" aria-hidden="true" />
                <span>Add to Tab</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right 5 Cols: Quick Counter Tap + Quick Start Tour Card + Recent Voice Activity */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div
          data-testid="quick-counter-tap-card"
          className="bg-white rounded-[24px] p-6 border border-black/[0.06]"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#1D1D1F]">
                Quick Counter Tap
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Mix voice with one-tap counter weighs
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {state.items.slice(0, 6).map((item) => {
              const isRupeeQuick = item.id === 'groundnuts';
              const quickLabel = isRupeeQuick
                ? '+₹20 (167g)'
                : item.unit === 'packet'
                ? '+1 packet'
                : '+500g (Ara kg)';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    isRupeeQuick
                      ? onQuickAddItem(item, Math.round((20 / item.sellingPrice) * 1000) / 1000, 20)
                      : onQuickAddItem(item, item.unit === 'packet' ? 1 : 0.5)
                  }
                  className="min-h-[60px] text-left p-3.5 rounded-2xl bg-[#F5F5F7] hover:bg-black/[0.07] transition-colors flex flex-col justify-between"
                >
                  <span className="font-display text-sm font-bold text-[#1D1D1F] truncate w-full">
                    {item.name}
                  </span>
                  <span className="mt-1 text-xs font-mono text-[#0F766E] font-semibold tabular-nums">
                    {quickLabel} · ₹{item.sellingPrice}/{item.unit}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Start Tour Launcher Card */}
        <div
          data-testid="quick-tour-card"
          className="bg-white rounded-[24px] p-5 border border-black/[0.06] flex items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold text-[#1D1D1F]">
                Quick Start Tour Guide
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5 leading-snug">
                Learn how &amp; where to use voice checkout, drums, Udhaar, profit &amp; human voices.
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="counter-start-tour-btn"
            onClick={onOpenQuickTour}
            className="h-9 px-3.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
          >
            Start Tour
          </button>
        </div>

        {state.voiceLogs.length > 0 && (
          <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
            <h2 className="font-display text-base font-bold text-[#1D1D1F] mb-3">
              Recent Voice Activity
            </h2>
            <ul className="divide-y divide-black/[0.06]">
              {state.voiceLogs.slice(0, 4).map((log) => (
                <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
                    <span className="font-mono tabular-nums">{log.timestamp}</span>
                    <span
                      className={`font-semibold ${
                        log.status === 'disambiguate'
                          ? 'text-[#D97706]'
                          : log.status === 'warning'
                          ? 'text-[#DC2626]'
                          : log.status === 'noise'
                          ? 'text-[#6E6E73]'
                          : 'text-[#0F766E]'
                      }`}
                    >
                      {log.status === 'disambiguate'
                        ? 'Paused · Verify'
                        : log.status === 'warning'
                        ? 'Applied · Low Stock'
                        : log.status === 'noise'
                        ? 'Ignored Noise'
                        : 'Applied'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#1D1D1F]">
                    “{log.transcript}”
                  </p>
                  <p className="mt-0.5 text-xs text-[#6E6E73]">{log.response}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add to Tab — Select Person Modal */}
      {showTabPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tab-picker-title"
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[24px] p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-black/[0.08] max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06]">
              <div>
                <h2
                  id="tab-picker-title"
                  className="font-display text-xl font-bold text-[#1D1D1F]"
                >
                  Select Person for Tab
                </h2>
                <p className="text-sm text-[#6E6E73] mt-0.5 tabular-nums">
                  Choose who to charge{' '}
                  <span className="font-mono font-bold text-[#0F766E]">
                    ₹{billTotal.toLocaleString('en-IN')}
                  </span>{' '}
                  ({state.activeBill.length}{' '}
                  {state.activeBill.length === 1 ? 'item' : 'items'})
                </p>
              </div>
              <button
                type="button"
                aria-label="Close customer tab picker"
                onClick={() => setShowTabPicker(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E6E73] hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mt-4">
              <Search
                className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <label htmlFor="tab-person-search" className="sr-only">
                Search customer name
              </label>
              <input
                id="tab-person-search"
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer name or phone..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F5F5F7] text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            {/* Scrollable Customer List */}
            <div
              data-testid="tab-customer-list"
              className="mt-3 overflow-y-auto flex-1 divide-y divide-black/[0.06]"
            >
              {filteredCustomers.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#6E6E73]">
                  No matching customer found. Add a new person below.
                </p>
              ) : (
                filteredCustomers.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelectTabPerson(person.id)}
                    className="w-full py-3.5 px-2 text-left flex items-center justify-between gap-3 hover:bg-[#F5F5F7] rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-[#1D1D1F] truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-[#6E6E73] font-mono tabular-nums mt-0.5">
                        {person.phone} · Current Tab ₹
                        {person.balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-sm font-bold text-[#0F766E] tabular-nums">
                        → ₹{(person.balance + billTotal).toLocaleString('en-IN')}
                      </span>
                      <ChevronRight
                        className="w-4 h-4 text-[#86868B]"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Inline New Person option */}
            <div className="pt-4 mt-3 border-t border-black/[0.06]">
              {!showNewPerson ? (
                <button
                  type="button"
                  onClick={() => {
                    setNewPersonError('');
                    setShowNewPerson(true);
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-sm font-semibold text-[#1D1D1F] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                  <span>Add New Person &amp; Charge Tab</span>
                </button>
              ) : (
                <form onSubmit={handleCreateAndBillPerson} className="space-y-2.5">
                  {newPersonError && (
                    <p className="text-xs font-semibold text-[#DC2626]">
                      {newPersonError}
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      aria-label="New customer name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Customer name"
                      className="h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                    <input
                      type="tel"
                      aria-label="New customer phone"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewPerson(false)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6E6E73] hover:bg-[#F5F5F7]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59]"
                    >
                      Create &amp; Add ₹{billTotal.toLocaleString('en-IN')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
