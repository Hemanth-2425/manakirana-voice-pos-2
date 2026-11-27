import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  MessageCircle,
  PackageCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { getLowStockItems } from '../engine/kiranaReducer';
import { KiranaItem, MissingDemandItem } from '../engine/types';

interface RefillListTabProps {
  items: KiranaItem[];
  missingDemand: MissingDemandItem[];
  onRestockItem: (itemId: string) => void;
  onAddMissingDemand: (name: string) => void;
  onRemoveMissingDemand: (id: string) => void;
}

export function RefillListTab({
  items,
  missingDemand,
  onRestockItem,
  onAddMissingDemand,
  onRemoveMissingDemand,
}: RefillListTabProps) {
  const [newDemandName, setNewDemandName] = useState('');
  const [copied, setCopied] = useState(false);

  const lowStockItems = getLowStockItems(items);

  const estimatedRefillCost = lowStockItems.reduce((sum, item) => {
    const needed = Math.max(0, Math.ceil(item.drumCapacity - item.stockQty));
    return sum + needed * item.wholesalePrice;
  }, 0);

  const whatsappText = [
    '*ManaKirana — Wholesale Mandi Refill Order*',
    '',
    '*1. Low-Stock Drums (<=15% left):*',
    ...(lowStockItems.length > 0
      ? lowStockItems.map((item) => {
          const orderQty = Math.max(1, Math.ceil(item.drumCapacity - item.stockQty));
          return `- ${item.name} (${item.localLabel}): Order ${orderQty} ${item.unit} (Only ${Number(item.stockQty.toFixed(1))} ${item.unit} left)`;
        })
      : ['- All drums above 15%']),
    '',
    '*2. Missing Customer Demand (Lost Sales Prevention):*',
    ...(missingDemand.length > 0
      ? missingDemand.map(
          (m) => `- ${m.name} (Asked ${m.requestedCount}x today)`
        )
      : ['- No missing customer requests']),
  ].join('\n');

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleAddDemand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newDemandName.trim();
    if (!cleaned) return;
    onAddMissingDemand(cleaned);
    setNewDemandName('');
  };

  const handleCopyOrder = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Wholesale Refill List
          </h1>
          <p className="text-sm text-[#6E6E73] mt-0.5 tabular-nums">
            {lowStockItems.length} low-stock drums · {missingDemand.length} missing customer items · Est. Mandi spend ₹{estimatedRefillCost.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyOrder}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-sm font-semibold text-[#1D1D1F] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                <span>Copied Order Text</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copy Order</span>
              </>
            )}
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>Share on WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Auto-Flagged Low-Stock Drums */}
        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1D1D1F]">
                Low-Stock Drums (≤15%)
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Auto-added during rush-hour billing so you never run dry
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-[#DC2626] tabular-nums">
              {lowStockItems.length} urgent
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-display text-base font-bold text-[#1D1D1F]">
                All drums are well stocked
              </p>
              <p className="text-sm text-[#6E6E73] mt-1">
                Any drum that drops below 15% capacity will appear here automatically.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.06] mt-2">
              {lowStockItems.map((item) => {
                const needed = Math.max(1, Math.ceil(item.drumCapacity - item.stockQty));
                const estCost = needed * item.wholesalePrice;
                return (
                  <li
                    key={item.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-display text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
                        <span>{item.name}</span>
                      </p>
                      <p className="text-xs text-[#DC2626] font-semibold mt-0.5 inline-flex items-center gap-1 tabular-nums">
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          Only {Number(item.stockQty.toFixed(1))} {item.unit} left of {item.drumCapacity} {item.unit} · Order {needed} {item.unit} (~₹{estCost.toLocaleString('en-IN')})
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRestockItem(item.id)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                    >
                      <PackageCheck className="w-4 h-4" aria-hidden="true" />
                      <span>Restocked ({item.drumCapacity} {item.unit})</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Missing Customer Demand */}
        <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
          <div className="pb-4 border-b border-black/[0.06]">
            <h2 className="font-display text-lg font-bold text-[#1D1D1F]">
              Missing Customer Demand
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Items customers asked for — stock them to stop losing buyers to delivery apps
            </p>
          </div>

          <form onSubmit={handleAddDemand} className="mt-4 flex items-center gap-2">
            <label htmlFor="missing-demand-input" className="sr-only">
              Add missing customer item
            </label>
            <input
              id="missing-demand-input"
              type="text"
              value={newDemandName}
              onChange={(e) => setNewDemandName(e.target.value)}
              placeholder="e.g., Brown Rice, Organic Honey..."
              className="flex-1 h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-black/85 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add</span>
            </button>
          </form>

          {missingDemand.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6E6E73]">
              No missing customer requests logged yet. Say “Customer asked for Brown Rice, add to supply list.”
            </p>
          ) : (
            <ul
              data-testid="missing-demand-list"
              className="divide-y divide-black/[0.06] mt-3"
            >
              {missingDemand.map((entry) => (
                <li
                  key={entry.id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-display text-base font-bold text-[#1D1D1F]">
                      {entry.name}
                    </p>
                    <p className="text-xs text-[#6E6E73] mt-0.5 tabular-nums">
                      Asked {entry.requestedCount}x · {entry.requestedAt} · {entry.note}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${entry.name} from supply list`}
                    onClick={() => onRemoveMissingDemand(entry.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#DC2626] hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Live WhatsApp Message Preview */}
      <div className="bg-white rounded-[24px] p-6 border border-black/[0.06]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-display text-base font-bold text-[#1D1D1F]">
            Ready-to-Send Mandi WhatsApp Message
          </h2>
          <span className="text-xs text-[#6E6E73]">Formatted for wholesale supplier</span>
        </div>
        <pre className="p-4 rounded-2xl bg-[#F5F5F7] text-xs sm:text-sm font-mono text-[#1D1D1F] whitespace-pre-wrap leading-relaxed">
          {whatsappText}
        </pre>
      </div>
    </div>
  );
}
