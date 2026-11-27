import React, { useState } from 'react';
import { Banknote, Plus, QrCode, UserPlus } from 'lucide-react';
import { UdhaarAccount } from '../engine/types';

interface UdhaarTabProps {
  accounts: UdhaarAccount[];
  onLogRepayment: (customerId: string, amount: number, method: 'cash' | 'upi') => void;
  onAddCustomer: (name: string, phone: string) => void;
}

export function UdhaarTab({
  accounts,
  onLogRepayment,
  onAddCustomer,
}: UdhaarTabProps) {
  const [repayInputs, setRepayInputs] = useState<Record<string, string>>({});
  const [repayErrors, setRepayErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [addError, setAddError] = useState('');

  const totalOutstanding = accounts.reduce((sum, a) => sum + a.balance, 0);
  const collectedToday = accounts.reduce(
    (sum, a) =>
      sum +
      a.transactions
        .filter((t) => t.type === 'repayment' && t.timestamp.startsWith('Today'))
        .reduce((s, t) => s + t.amount, 0),
    0
  );

  const handleRepay = (account: UdhaarAccount, method: 'cash' | 'upi', overrideAmount?: number) => {
    const raw = overrideAmount !== undefined ? overrideAmount : Number(repayInputs[account.id]);
    if (!Number.isFinite(raw) || raw <= 0) {
      setRepayErrors((prev) => ({
        ...prev,
        [account.id]: 'Enter a valid repayment amount greater than ₹0.',
      }));
      return;
    }
    setRepayErrors((prev) => ({ ...prev, [account.id]: '' }));
    onLogRepayment(account.id, Math.round(raw), method);
    setRepayInputs((prev) => ({ ...prev, [account.id]: '' }));
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedName = newName.trim();
    if (!cleanedName) {
      setAddError('Customer name is required.');
      return;
    }
    onAddCustomer(cleanedName, newPhone.trim() || '+91 90000 00000');
    setNewName('');
    setNewPhone('');
    setAddError('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <p className="text-xs font-semibold text-[#6E6E73]">Total Udhaar Receivable</p>
          <p
            data-testid="total-udhaar-balance"
            className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums text-[#1D1D1F]"
          >
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-[#6E6E73]">
            Across {accounts.length} neighborhood accounts
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <p className="text-xs font-semibold text-[#6E6E73]">Collected Today</p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-tight tabular-nums text-[#0F766E]">
            ₹{collectedToday.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs text-[#6E6E73]">Cash & UPI debt repayments</p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6E6E73]">Voice Credit Ledger</p>
            <p className="mt-1 text-sm text-[#1D1D1F] font-medium">
              Say “Ramesh paid 200 rupees cash” to update balances hands-free.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="mt-3 min-h-[42px] px-4 py-2 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-sm font-semibold text-[#1D1D1F] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
            <span>{showAddForm ? 'Close Form' : 'Add Udhaar Account'}</span>
          </button>
        </div>
      </div>

      {/* Optional Add Customer Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCustomer}
          className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1">
            <label
              htmlFor="new-udhaar-name"
              className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
            >
              Customer Name
            </label>
            <input
              id="new-udhaar-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Suresh Rao"
              className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
          <div className="sm:w-56">
            <label
              htmlFor="new-udhaar-phone"
              className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
            >
              Mobile Number
            </label>
            <input
              id="new-udhaar-phone"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 98480 00000"
              className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:bg-[#115E59] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create Account</span>
          </button>
          {addError && (
            <p className="text-xs font-semibold text-[#DC2626] sm:col-span-3">{addError}</p>
          )}
        </form>
      )}

      {/* Customer Account Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            data-testid={`udhaar-card-${account.id}`}
            className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col gap-5"
          >
            {/* Header & Big Balance */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/[0.06]">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1D1D1F]">
                  {account.name}
                </h2>
                <p className="text-xs text-[#6E6E73] mt-0.5 font-mono">
                  {account.phone} · Updated {account.lastUpdated}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#6E6E73]">Balance Due</p>
                <p
                  data-testid={`udhaar-balance-${account.id}`}
                  className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                    account.balance > 0 ? 'text-[#DC2626]' : 'text-[#0F766E]'
                  }`}
                >
                  ₹{account.balance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Repayment Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`repay-input-${account.id}`}
                  className="text-xs font-semibold text-[#6E6E73]"
                >
                  Log Repayment
                </label>
                <div className="flex items-center gap-1.5">
                  {[100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setRepayInputs((prev) => ({
                          ...prev,
                          [account.id]: String(preset),
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-black/[0.08] text-xs font-mono font-semibold text-[#1D1D1F] tabular-nums"
                    >
                      ₹{preset}
                    </button>
                  ))}
                  {account.balance > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRepayInputs((prev) => ({
                          ...prev,
                          [account.id]: String(account.balance),
                        }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] hover:bg-black/[0.08] text-xs font-semibold text-[#0F766E]"
                    >
                      Full
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  id={`repay-input-${account.id}`}
                  type="number"
                  min="1"
                  value={repayInputs[account.id] ?? ''}
                  onChange={(e) =>
                    setRepayInputs((prev) => ({
                      ...prev,
                      [account.id]: e.target.value,
                    }))
                  }
                  placeholder="Enter ₹ amount..."
                  className="flex-1 h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <button
                  type="button"
                  aria-label={`Log Cash repayment for ${account.name}`}
                  onClick={() => handleRepay(account, 'cash')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Banknote className="w-4 h-4" aria-hidden="true" />
                  <span>Log Cash</span>
                </button>
                <button
                  type="button"
                  aria-label={`Log UPI repayment for ${account.name}`}
                  onClick={() => handleRepay(account, 'upi')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-[#1D1D1F] text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <QrCode className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                  <span>Log UPI</span>
                </button>
              </div>
              {repayErrors[account.id] && (
                <p className="text-xs font-semibold text-[#DC2626]">
                  {repayErrors[account.id]}
                </p>
              )}
            </div>

            {/* Ledger History */}
            <div className="pt-2 border-t border-black/[0.06]">
              <h3 className="text-xs font-semibold text-[#6E6E73] mb-2">
                Recent Ledger Entries
              </h3>
              <ul className="divide-y divide-black/[0.05]">
                {account.transactions.slice(0, 5).map((tx) => (
                  <li
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#1D1D1F] truncate">{tx.note}</p>
                      <p className="text-xs text-[#6E6E73]">{tx.timestamp}</p>
                    </div>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        tx.type === 'repayment' ? 'text-[#0F766E]' : 'text-[#DC2626]'
                      }`}
                    >
                      {tx.type === 'repayment' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
