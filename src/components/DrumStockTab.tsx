import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '../engine/seedData';
import { KiranaItem, PricingUnit } from '../engine/types';

interface DrumStockTabProps {
  items: KiranaItem[];
  onAddItem: (payload: {
    name: string;
    localLabel: string;
    stockQty: number;
    drumCapacity: number;
    wholesalePrice: number;
    sellingPrice: number;
    unit: PricingUnit;
  }) => void;
  onEditItem: (
    itemId: string,
    updates: {
      name: string;
      stockQty: number;
      drumCapacity: number;
      wholesalePrice: number;
      sellingPrice: number;
      unit: PricingUnit;
    }
  ) => void;
  onQuickRestock: (itemId: string) => void;
}

export function DrumStockTab({
  items,
  onAddItem,
  onEditItem,
  onQuickRestock,
}: DrumStockTabProps) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    stockQty: '',
    drumCapacity: '',
    wholesalePrice: '',
    sellingPrice: '',
    unit: 'kg' as PricingUnit,
  });
  const [editError, setEditError] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    localLabel: '',
    stockQty: '20',
    drumCapacity: '25',
    wholesalePrice: '',
    sellingPrice: '',
    unit: 'kg' as PricingUnit,
  });
  const [addError, setAddError] = useState('');

  const filteredItems = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.localLabel.toLowerCase().includes(q) ||
      item.synonyms.some((s) => s.toLowerCase().includes(q))
    );
  });

  const lowCount = items.filter(
    (i) => i.drumCapacity > 0 && i.stockQty / i.drumCapacity <= LOW_STOCK_THRESHOLD
  ).length;

  const startEditing = (item: KiranaItem) => {
    setEditingId(item.id);
    setEditError('');
    setEditForm({
      name: item.name,
      stockQty: String(item.stockQty),
      drumCapacity: String(item.drumCapacity),
      wholesalePrice: String(item.wholesalePrice),
      sellingPrice: String(item.sellingPrice),
      unit: item.unit,
    });
  };

  const handleSaveEdit = (itemId: string) => {
    const name = editForm.name.trim();
    const stockQty = Number(editForm.stockQty);
    const drumCapacity = Number(editForm.drumCapacity);
    const wholesalePrice = Number(editForm.wholesalePrice);
    const sellingPrice = Number(editForm.sellingPrice);

    if (!name) {
      setEditError('Item name is required.');
      return;
    }
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      setEditError('Stock quantity must be 0 or higher.');
      return;
    }
    if (!Number.isFinite(drumCapacity) || drumCapacity <= 0) {
      setEditError('Drum capacity must be greater than 0.');
      return;
    }
    if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 0 || !Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setEditError('Wholesale and selling prices must be positive.');
      return;
    }

    onEditItem(itemId, {
      name,
      stockQty,
      drumCapacity: Math.max(drumCapacity, stockQty),
      wholesalePrice,
      sellingPrice,
      unit: editForm.unit,
    });
    setEditingId(null);
    setEditError('');
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = addForm.name.trim();
    const stockQty = Number(addForm.stockQty);
    const drumCapacity = Number(addForm.drumCapacity);
    const wholesalePrice = Number(addForm.wholesalePrice);
    const sellingPrice = Number(addForm.sellingPrice);

    if (!name) {
      setAddError('Please enter an item name.');
      return;
    }
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      setAddError('Please enter a valid stock quantity.');
      return;
    }
    if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 0 || !Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setAddError('Wholesale and selling prices must be greater than ₹0.');
      return;
    }

    onAddItem({
      name,
      localLabel: addForm.localLabel.trim() || 'Kirana Drum Item',
      stockQty,
      drumCapacity: Math.max(drumCapacity || 25, stockQty),
      wholesalePrice,
      sellingPrice,
      unit: addForm.unit,
    });

    setAddForm({
      name: '',
      localLabel: '',
      stockQty: '20',
      drumCapacity: '25',
      wholesalePrice: '',
      sellingPrice: '',
      unit: 'kg',
    });
    setAddError('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Live Drum Stock & Catalog
          </h1>
          <p className="text-sm text-[#6E6E73] mt-0.5 tabular-nums">
            {items.length} active Kirana items · 15% drum low-stock alert ·{' '}
            <span className={lowCount > 0 ? 'text-[#DC2626] font-semibold' : ''}>
              {lowCount} {lowCount === 1 ? 'drum needs refill' : 'drums need refill'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="stock-search-input" className="sr-only">
              Search drum catalog
            </label>
            <input
              id="stock-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sugar, kandipappu..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F5F5F7] text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setAddError('');
              setShowAddModal(true);
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#115E59] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Drum Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          const fillRatio =
            item.drumCapacity > 0
              ? Math.min(1, Math.max(0, item.stockQty / item.drumCapacity))
              : 0;
          const fillPercent = Math.round(fillRatio * 100);
          const isLow = fillRatio <= LOW_STOCK_THRESHOLD;
          const margin = item.sellingPrice - item.wholesalePrice;
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              data-testid={`drum-card-${item.id}`}
              className="bg-white rounded-[24px] p-6 border border-black/[0.06] flex flex-col justify-between gap-4"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-[#1D1D1F]">
                      Edit {item.name}
                    </h2>
                    <button
                      type="button"
                      aria-label={`Cancel editing ${item.name}`}
                      onClick={() => setEditingId(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6E6E73] hover:bg-[#F5F5F7]"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {editError && (
                    <p className="text-xs font-semibold text-[#DC2626]">{editError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label
                        htmlFor={`edit-name-${item.id}`}
                        className="block text-xs font-semibold text-[#6E6E73] mb-1"
                      >
                        Item Name
                      </label>
                      <input
                        id={`edit-name-${item.id}`}
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-qty-${item.id}`}
                        className="block text-xs font-semibold text-[#6E6E73] mb-1"
                      >
                        Live Stock Qty
                      </label>
                      <input
                        id={`edit-qty-${item.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={editForm.stockQty}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, stockQty: e.target.value }))
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-unit-${item.id}`}
                        className="block text-xs font-semibold text-[#6E6E73] mb-1"
                      >
                        Pricing Unit
                      </label>
                      <select
                        id={`edit-unit-${item.id}`}
                        value={editForm.unit}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            unit: e.target.value as PricingUnit,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      >
                        <option value="kg">Per Kilogram (kg)</option>
                        <option value="g">Per Gram (g)</option>
                        <option value="packet">Per Packet / Unit</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-wholesale-${item.id}`}
                        className="block text-xs font-semibold text-[#6E6E73] mb-1"
                      >
                        Wholesale Cost (₹)
                      </label>
                      <input
                        id={`edit-wholesale-${item.id}`}
                        type="number"
                        min="1"
                        value={editForm.wholesalePrice}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            wholesalePrice: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-selling-${item.id}`}
                        className="block text-xs font-semibold text-[#6E6E73] mb-1"
                      >
                        Selling Price (₹)
                      </label>
                      <input
                        id={`edit-selling-${item.id}`}
                        type="number"
                        min="1"
                        value={editForm.sellingPrice}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            sellingPrice: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold text-[#6E6E73] hover:bg-[#F5F5F7]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(item.id)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#115E59]"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#1D1D1F]">
                        {item.name}
                      </h2>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        {item.localLabel}
                        {item.isLoose ? ' · 1.5% tarugu buffer' : ' · Sealed pack'}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => startEditing(item)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-black/[0.08] text-xs font-semibold text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
                  </div>

                  {/* Bold 3-feet readable Drum Stock + Selling Rate */}
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${
                            isLow ? 'text-[#DC2626]' : 'text-[#1D1D1F]'
                          }`}
                        >
                          {Number(item.stockQty.toFixed(2))}{' '}
                          {item.unit === 'packet' && item.stockQty !== 1 ? 'packets' : item.unit}
                        </span>
                        <span className="text-sm text-[#6E6E73] font-mono tabular-nums">
                          / {item.drumCapacity}{' '}
                          {item.unit === 'packet' && item.drumCapacity !== 1 ? 'packets' : item.unit}
                        </span>
                      </div>
                      {isLow ? (
                        <p className="mt-1 text-xs font-bold text-[#DC2626] inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Low drum ({fillPercent}%) · Added to Wholesale Refill List</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#6E6E73] tabular-nums">
                          Drum {fillPercent}% full
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-2xl font-bold tabular-nums text-[#1D1D1F]">
                        ₹{item.sellingPrice}
                        <span className="text-xs font-sans font-medium text-[#6E6E73]">
                          /{item.unit}
                        </span>
                      </p>
                      <p className="text-xs text-[#6E6E73] font-mono tabular-nums">
                        Cost ₹{item.wholesalePrice} · +₹{margin} margin
                      </p>
                    </div>
                  </div>

                  {/* Visual 25kg Drum Progress Bar with 15% Threshold Marker */}
                  <div className="space-y-2">
                    <div className="relative h-3.5 w-full rounded-full bg-[#F5F5F7] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(3, fillPercent)}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLow
                            ? 'bg-[#DC2626]'
                            : fillPercent <= 35
                            ? 'bg-[#D97706]'
                            : 'bg-[#0F766E]'
                        }`}
                      />
                      <div
                        title="15% low-stock alert threshold"
                        style={{ left: '15%' }}
                        className="absolute top-0 bottom-0 w-[2px] bg-[#1D1D1F]/30"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                      <span>15% refill trigger</span>
                      <button
                        type="button"
                        onClick={() => onQuickRestock(item.id)}
                        className="font-semibold text-[#0F766E] hover:underline"
                      >
                        + Fill Drum ({item.drumCapacity}{' '}
                        {item.unit === 'packet' ? 'packets' : item.unit})
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-modal-title"
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-[24px] p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-black/[0.08]">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <h2
                id="add-item-modal-title"
                className="font-display text-xl font-bold text-[#1D1D1F]"
              >
                Add New Kirana Item
              </h2>
              <button
                type="button"
                aria-label="Close add item dialog"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6E6E73] hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-5 space-y-4">
              {addError && (
                <p className="text-sm font-semibold text-[#DC2626] bg-red-50 px-3.5 py-2.5 rounded-xl">
                  {addError}
                </p>
              )}

              <div>
                <label
                  htmlFor="new-item-name"
                  className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                >
                  Item Name
                </label>
                <input
                  id="new-item-name"
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Ragi Flour"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-item-local"
                  className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                >
                  Local Telugu / Hindi Name (Optional)
                </label>
                <input
                  id="new-item-local"
                  type="text"
                  value={addForm.localLabel}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, localLabel: e.target.value }))
                  }
                  placeholder="e.g., Ragi Pindi · Nachni"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="new-item-stock"
                    className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                  >
                    Opening Stock
                  </label>
                  <input
                    id="new-item-stock"
                    type="number"
                    step="0.5"
                    min="0"
                    value={addForm.stockQty}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, stockQty: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-item-unit"
                    className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                  >
                    Unit Pricing
                  </label>
                  <select
                    id="new-item-unit"
                    value={addForm.unit}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        unit: e.target.value as PricingUnit,
                      }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="kg">Per Kilogram (kg)</option>
                    <option value="g">Per Gram (g)</option>
                    <option value="packet">Per Packet / Unit</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-item-wholesale"
                    className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                  >
                    Wholesale Price (₹)
                  </label>
                  <input
                    id="new-item-wholesale"
                    type="number"
                    min="1"
                    value={addForm.wholesalePrice}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, wholesalePrice: e.target.value }))
                    }
                    placeholder="46"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-item-selling"
                    className="block text-xs font-semibold text-[#6E6E73] mb-1.5"
                  >
                    Selling Price (₹)
                  </label>
                  <input
                    id="new-item-selling"
                    type="number"
                    min="1"
                    value={addForm.sellingPrice}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, sellingPrice: e.target.value }))
                    }
                    placeholder="55"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F5F5F7] text-sm font-mono font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6E6E73] hover:bg-[#F5F5F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold hover:bg-[#115E59] transition-colors"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
