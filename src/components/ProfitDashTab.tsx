import React, { useState } from 'react';
import { Plus, Trash2, Volume2 } from 'lucide-react';
import { computeProfitSummary } from '../engine/kiranaReducer';
import { AppState, DailySpend } from '../engine/types';

interface ProfitDashTabProps {
  state: AppState;
  onAddSpend: (label: string, amount: number, category: DailySpend['category']) => void;
  onRemoveSpend: (spendId: string) => void;
  onSpeakBriefing: () => void;
}

export function ProfitDashTab({
  state,
  onAddSpend,
  onRemoveSpend,
  onSpeakBriefing,
}: ProfitDashTabProps) {
  const [spendLabel, setSpendLabel] = useState('');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCategory, setSpendCategory] = useState<DailySpend['category']>('vendor');
  const [spendError, setSpendError] = useState('');

  const summary = computeProfitSummary(state);
  const maxItemProfit = Math.max(
    1,
    ...summary.rankedItems.map((i) => Math.max(0, i.todayNetProfit))
  );

  const handleSubmitSpend = (e: React.FormEvent) => {
    e.preventDefault();
    const label = spendLabel.trim();
    const amount = Number(spendAmount);
    if (!label) {
      setSpendError('Enter who or what you paid.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setSpendError('Enter an amount greater than ₹0.');
      return;
    }
    onAddSpend(label, Math.round(amount), spendCategory);
    setSpendLabel('');
    setSpendAmount('');
    setSpendError('');
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Bold KPI Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <p className="text-xs font-semibold text-[#6E6E73]">Today’s Gross Sales</p>
          <p
            data-testid="kpi-total-sales"
            className="mt-2 font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#1D1D1F]"
          >
            ₹{summary.totalSales.toLocaleString('en-IN')}
          </p>
          <p className="mt-1.5 text-xs text-[#6E6E73] tabular-nums">
            {state.salesHistory.length} bills · Cash, UPI & Udhaar combined
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <p className="text-xs font-semibold text-[#6E6E73]">Today’s Owner Spends</p>
          <p
            data-testid="kpi-total-spends"
            className="mt-2 font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums text-[#DC2626]"
          >
            ₹{summary.totalSpends.toLocaleString('en-IN')}
          </p>
          <p className="mt-1.5 text-xs text-[#6E6E73] tabular-nums">
            {state.dailySpends.length === 0
              ? 'No vendor or auto spends logged yet'
              : `${state.dailySpends.length} shop payouts logged today`}
          </p>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6E6E73]">
              Net Profit (After 1.5% Tarugu)
            </p>
            <p
              data-testid="kpi-net-profit"
              className={`mt-2 font-mono text-4xl sm:text-5xl font-bold tracking-tight tabular-nums ${
                summary.netProfit >= 0 ? 'text-[#0F766E]' : 'text-[#DC2626]'
              }`}
            >
              ₹{summary.netProfit.toLocaleString('en-IN')}
            </p>
            <p className="mt-1.5 text-xs text-[#6E6E73] tabular-nums">
              Tarugu spillage deducted: ₹{summary.totalTaruguLoss.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            type="button"
            onClick={onSpeakBriefing}
            className="mt-4 min-h-[42px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Speak Profit Briefing (“Eeroju Labham”)</span>
          </button>
        </div>
      </div>

      {/* Two-Column Analytics + Daily Spends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: AI Ranking — Most Sold vs Most Profited Items */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <div className="flex flex-wrap items-end justify-between gap-2 pb-4 border-b border-black/[0.06]">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1D1D1F]">
                AI Profit Ranking: Most Sold vs. Most Profited
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                True item margin after wholesale cost and 1.5% loose-grain tarugu spillage
              </p>
            </div>
            {summary.topProfitItem && summary.mostSoldItem && (
              <p className="text-xs font-semibold text-[#0F766E] tabular-nums">
                Top Earner: {summary.topProfitItem.name} (₹{summary.topProfitItem.todayNetProfit})
              </p>
            )}
          </div>

          <ul
            data-testid="ai-profit-ranking"
            className="divide-y divide-black/[0.06] mt-2"
          >
            {summary.rankedItems.map((item) => {
              const barPct = Math.max(
                4,
                Math.round((Math.max(0, item.todayNetProfit) / maxItemProfit) * 100)
              );
              return (
                <li key={item.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-bold text-[#1D1D1F]">
                          {item.name}
                        </span>
                        {item.isHighProfit && (
                          <span className="px-2 py-0.5 rounded-md bg-[#0F766E]/12 text-[#0F766E] text-[11px] font-bold tracking-wide">
                            HIGH PROFIT
                          </span>
                        )}
                        {item.isMostSold && (
                          <span className="px-2 py-0.5 rounded-md bg-[#1D1D1F]/8 text-[#1D1D1F] text-[11px] font-bold tracking-wide">
                            MOST SOLD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6E73] mt-0.5 tabular-nums">
                        Sold {item.todaySoldQty}{' '}
                        {item.unit === 'packet' && item.todaySoldQty !== 1 ? 'packets' : item.unit} · Revenue ₹
                        {item.todayRevenue.toLocaleString('en-IN')} · Tarugu -₹
                        {item.todayTaruguCost}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-xl font-bold tabular-nums text-[#0F766E]">
                        ₹{item.todayNetProfit.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[#6E6E73]">net profit</p>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                    <div
                      style={{ width: `${barPct}%` }}
                      className={`h-full rounded-full ${
                        item.isHighProfit ? 'bg-[#0F766E]' : 'bg-[#1D1D1F]/30'
                      }`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right 5 Cols: Owner Daily Spends Log */}
        <div className="lg:col-span-5 bg-white rounded-[24px] p-6 border border-black/[0.06] space-y-5">
          <div className="pb-4 border-b border-black/[0.06]">
            <h2 className="font-display text-xl font-bold text-[#1D1D1F]">
              Daily Owner Spends
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Milk van, Mandi auto, electricity, or helper wages
            </p>
          </div>

          <form onSubmit={handleSubmitSpend} className="space-y-3">
            {spendError && (
              <p className="text-xs font-semibold text-[#DC2626]">{spendError}</p>
            )}
            <div>
              <label
                htmlFor="spend-label-input"
                className="block text-xs font-semibold text-[#6E6E73] mb-1"
              >
                Expense Description
              </label>
              <input
                id="spend-label-input"
                type="text"
                value={spendLabel}
                onChange={(e) => setSpendLabel(e.target.value)}
                placeholder="e.g., Milk Van, Mandi Auto"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="spend-amount-input"
                  className="block text-xs font-semibold text-[#6E6E73] mb-1"
                >
                  Amount (₹)
                </label>
                <input
                  id="spend-amount-input"
                  type="number"
                  min="1"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  placeholder="1450"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label
                  htmlFor="spend-category-select"
                  className="block text-xs font-semibold text-[#6E6E73] mb-1"
                >
                  Category
                </label>
                <select
                  id="spend-category-select"
                  value={spendCategory}
                  onChange={(e) =>
                    setSpendCategory(e.target.value as DailySpend['category'])
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="vendor">Vendor / Milk Van</option>
                  <option value="transport">Mandi Auto / Transport</option>
                  <option value="utility">Shop Utility</option>
                  <option value="other">Other Expense</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black/85 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Log Daily Spend</span>
            </button>
          </form>

          {/* Spends List */}
          <div className="pt-2 border-t border-black/[0.06]">
            {state.dailySpends.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#6E6E73]">
                Say “Paid 1,450 to milk van, 220 Mandi auto. Eeroju labham entha?” or log a spend above.
              </p>
            ) : (
              <ul
                data-testid="daily-spends-list"
                className="divide-y divide-black/[0.06]"
              >
                {state.dailySpends.map((sp) => (
                  <li
                    key={sp.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#1D1D1F]">{sp.label}</p>
                      <p className="text-xs text-[#6E6E73]">
                        {sp.category} · {sp.timestamp}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tabular-nums text-[#DC2626]">
                        -₹{sp.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete spend ${sp.label}`}
                        onClick={() => onRemoveSpend(sp.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#DC2626] hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
