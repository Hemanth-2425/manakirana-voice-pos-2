import { LOW_STOCK_THRESHOLD, TARUGU_RATE } from './seedData';
import {
  AppState,
  BillLine,
  DailySpend,
  KiranaItem,
  PaymentMethod,
  PricingUnit,
  VoiceLogEntry,
} from './types';
import {
  detectSpokenLanguage,
  formatWeightDisplay,
  normalizeIndianPhonetics,
  ParsedBillItem,
  parseVoiceUtterance,
  summarizeParsedCommand,
  VoiceCommand,
} from './voiceParser';

export interface ProfitItemAnalytics {
  id: string;
  name: string;
  localLabel: string;
  unit: PricingUnit;
  todaySoldQty: number;
  todayRevenue: number;
  todayNetProfit: number;
  todayTaruguCost: number;
  isMostSold: boolean;
  isHighProfit: boolean;
}

export interface ShopProfitSummary {
  totalSales: number;
  totalSpends: number;
  totalTaruguLoss: number;
  grossProfitAfterTarugu: number;
  netProfit: number;
  rankedItems: ProfitItemAnalytics[];
  topProfitItem: ProfitItemAnalytics | null;
  mostSoldItem: ProfitItemAnalytics | null;
}

export function getLowStockItems(items: KiranaItem[]): KiranaItem[] {
  return items.filter((item) => {
    const ratio = item.drumCapacity > 0 ? item.stockQty / item.drumCapacity : 1;
    return ratio <= LOW_STOCK_THRESHOLD;
  });
}

export function computeProfitSummary(state: AppState): ShopProfitSummary {
  const totalSales = Math.round(
    state.salesHistory.reduce((acc, s) => acc + s.totalAmount, 0)
  );
  const totalSpends = Math.round(
    state.dailySpends.reduce((acc, s) => acc + s.amount, 0)
  );
  const totalTaruguLoss = Math.round(
    state.salesHistory.reduce((acc, s) => acc + s.taruguLossRupees, 0)
  );
  const grossProfitAfterTarugu = Math.round(
    state.salesHistory.reduce((acc, s) => acc + s.netProfitRupees, 0)
  );
  const netProfit = grossProfitAfterTarugu - totalSpends;

  const itemMetrics = state.items.map((item) => {
    const todayNetProfit = Math.round(
      item.todayRevenue - item.todayWholesaleCost - item.todayTaruguCost
    );
    return {
      id: item.id,
      name: item.name,
      localLabel: item.localLabel,
      unit: item.unit,
      todaySoldQty: Math.round(item.todaySoldQty * 100) / 100,
      todayRevenue: Math.round(item.todayRevenue),
      todayNetProfit,
      todayTaruguCost: Math.round(item.todayTaruguCost),
      isMostSold: false,
      isHighProfit: false,
    };
  });

  const sortedByProfit = [...itemMetrics].sort((a, b) => b.todayNetProfit - a.todayNetProfit);
  const sortedByQty = [...itemMetrics].sort((a, b) => b.todaySoldQty - a.todaySoldQty);

  const topProfitId = sortedByProfit[0]?.id;
  const mostSoldId = sortedByQty[0]?.id;

  const rankedItems = sortedByProfit.map((entry) => ({
    ...entry,
    isHighProfit: entry.id === topProfitId && entry.todayNetProfit > 0,
    isMostSold: entry.id === mostSoldId && entry.todaySoldQty > 0,
  }));

  return {
    totalSales,
    totalSpends,
    totalTaruguLoss,
    grossProfitAfterTarugu,
    netProfit,
    rankedItems,
    topProfitItem: rankedItems[0] ?? null,
    mostSoldItem: rankedItems.find((r) => r.isMostSold) ?? rankedItems[0] ?? null,
  };
}

function nowTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function createBillLine(item: KiranaItem, parsed: ParsedBillItem): BillLine {
  const lineTotal =
    parsed.orderedByRupees !== undefined
      ? Math.round(parsed.orderedByRupees)
      : Math.round(parsed.quantity * item.sellingPrice);

  const taruguQty = item.isLoose
    ? Math.round(parsed.quantity * TARUGU_RATE * 10000) / 10000
    : 0;

  return {
    id: `line-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId: item.id,
    itemName: item.name,
    unit: item.unit,
    quantity: parsed.quantity,
    displayQty: parsed.displayQty,
    taruguQty,
    unitPrice: item.sellingPrice,
    wholesalePrice: item.wholesalePrice,
    lineTotal,
    isLoose: item.isLoose,
    orderedByRupees: parsed.orderedByRupees,
  };
}

export function addOrUpdateBillLine(
  activeBill: BillLine[],
  newLine: BillLine,
  replaceExisting = false
): BillLine[] {
  const existingIdx = activeBill.findIndex((line) => line.itemId === newLine.itemId);
  if (existingIdx === -1) {
    return [...activeBill, newLine];
  }

  if (replaceExisting) {
    return activeBill.map((line, idx) => (idx === existingIdx ? newLine : line));
  }

  const prev = activeBill[existingIdx];
  const mergedQty = Math.round((prev.quantity + newLine.quantity) * 1000) / 1000;
  const mergedTotal = prev.lineTotal + newLine.lineTotal;
  const mergedTarugu = prev.isLoose
    ? Math.round(mergedQty * TARUGU_RATE * 10000) / 10000
    : 0;

  const updated: BillLine = {
    ...prev,
    quantity: mergedQty,
    displayQty: formatWeightDisplay(mergedQty, prev.unit),
    taruguQty: mergedTarugu,
    lineTotal: mergedTotal,
  };

  return activeBill.map((line, idx) => (idx === existingIdx ? updated : line));
}

export function finalizeActiveBill(
  state: AppState,
  method: PaymentMethod,
  customerId?: string | null
): { state: AppState; spokenResponse: string; warning?: string } {
  if (state.activeBill.length === 0) {
    return {
      state,
      spokenResponse: 'No items in the bill yet. Speak an item to start billing.',
    };
  }

  const targetCustomerId = method === 'udhaar' ? customerId ?? state.activeCustomerId ?? state.udhaarAccounts[0]?.id : null;
  const customer = targetCustomerId
    ? state.udhaarAccounts.find((a) => a.id === targetCustomerId)
    : undefined;

  const totalAmount = state.activeBill.reduce((sum, l) => sum + l.lineTotal, 0);
  let totalTaruguRupees = 0;
  let totalNetProfit = 0;

  const updatedItems = state.items.map((item) => {
    const line = state.activeBill.find((l) => l.itemId === item.id);
    if (!line) return item;

    const totalDeduct = line.quantity + line.taruguQty;
    const nextStock = Math.max(0, Math.round((item.stockQty - totalDeduct) * 10000) / 10000);
    const wholesaleCost = line.quantity * item.wholesalePrice;
    const taruguCost = line.taruguQty * item.wholesalePrice;
    totalTaruguRupees += taruguCost;
    totalNetProfit += line.lineTotal - wholesaleCost - taruguCost;

    return {
      ...item,
      stockQty: nextStock,
      todaySoldQty: Math.round((item.todaySoldQty + line.quantity) * 1000) / 1000,
      todayRevenue: Math.round(item.todayRevenue + line.lineTotal),
      todayWholesaleCost: Math.round(item.todayWholesaleCost + wholesaleCost),
      todayTaruguCost: Math.round((item.todayTaruguCost + taruguCost) * 10) / 10,
    };
  });

  const summaryParts = state.activeBill.map((l) => {
    if (l.unit === 'packet') {
      return `${l.quantity} ${l.itemName.toLowerCase()} ${l.quantity === 1 ? 'packet' : 'packets'}`;
    }
    return `${l.itemName} ${l.displayQty}`;
  });

  const updatedUdhaar = state.udhaarAccounts.map((acc) => {
    if (!customer || acc.id !== customer.id) return acc;
    return {
      ...acc,
      balance: Math.round(acc.balance + totalAmount),
      lastUpdated: `Today, ${nowTimeString()}`,
      transactions: [
        {
          id: `tx-${Date.now()}`,
          timestamp: `Today, ${nowTimeString()}`,
          type: 'credit' as const,
          amount: totalAmount,
          note: summaryParts.join(', '),
        },
        ...acc.transactions,
      ],
    };
  });

  const lowStock = getLowStockItems(updatedItems);
  const lowWarning =
    lowStock.length > 0
      ? `Warning: ${lowStock[0].name} only ${lowStock[0].stockQty} ${lowStock[0].unit === 'kg' ? 'kilos' : lowStock[0].unit} left—added to wholesale refill list.`
      : undefined;

  const methodPhrase =
    method === 'udhaar' && customer
      ? `Total ${totalAmount} rupees added to ${customer.name} account.`
      : `Total ${totalAmount} rupees received via ${method.toUpperCase()}.`;

  const spokenResponse = [
    `${summaryParts.join(', ')}.`,
    methodPhrase,
    lowWarning,
    'Ready for next customer.',
  ]
    .filter(Boolean)
    .join(' ');

  const saleRecord = {
    id: `sale-${Date.now()}`,
    timestamp: nowTimeString(),
    items: state.activeBill,
    totalAmount,
    paymentMethod: method,
    customerId: customer?.id,
    customerName: customer?.name,
    taruguLossRupees: Math.round(totalTaruguRupees),
    netProfitRupees: Math.round(totalNetProfit),
  };

  return {
    state: {
      ...state,
      items: updatedItems,
      activeBill: [],
      activeCustomerId: null,
      udhaarAccounts: updatedUdhaar,
      salesHistory: [saleRecord, ...state.salesHistory],
      lastBillSummary: {
        total: totalAmount,
        method,
        customerName: customer?.name,
        itemCount: state.activeBill.length,
        warning: lowWarning,
      },
      lastSpokenResponse: spokenResponse,
      lastVoiceStatus: 'speaking',
    },
    spokenResponse,
    warning: lowWarning,
  };
}

function executeSingleCommand(
  state: AppState,
  command: VoiceCommand
): { state: AppState; spokenResponse: string; status: VoiceLogEntry['status'] } {
  switch (command.type) {
    case 'stock_in': {
      const updatedItems = state.items.map((item) => {
        if (item.id !== command.itemId) return item;
        const nextWholesale = command.wholesalePrice ?? item.wholesalePrice;
        const nextSelling = command.sellingPrice ?? item.sellingPrice;
        return {
          ...item,
          stockQty: command.stockQty,
          drumCapacity: Math.max(item.drumCapacity, command.stockQty),
          wholesalePrice: nextWholesale,
          sellingPrice: nextSelling,
        };
      });
      const updated = updatedItems.find((i) => i.id === command.itemId);
      const unitWord = updated?.unit === 'packet' ? 'packets' : 'kilos';
      const spokenResponse = `${command.itemName} drum updated to ${command.stockQty} ${unitWord}, wholesale ${updated?.wholesalePrice ?? ''}, selling ${updated?.sellingPrice ?? ''} rupees per ${updated?.unit === 'packet' ? 'packet' : 'kilo'}.`;
      return {
        state: { ...state, items: updatedItems },
        spokenResponse,
        status: 'success',
      };
    }

    case 'edit_rate': {
      const updatedItems = state.items.map((item) => {
        if (item.id !== command.itemId) return item;
        return {
          ...item,
          sellingPrice: command.sellingPrice,
          wholesalePrice: command.wholesalePrice ?? item.wholesalePrice,
        };
      });
      const spokenResponse = `Updated ${command.itemName} selling rate to ${command.sellingPrice} rupees.`;
      return {
        state: { ...state, items: updatedItems },
        spokenResponse,
        status: 'success',
      };
    }

    case 'add_item': {
      const existing = state.items.find(
        (i) => i.name.toLowerCase() === command.name.toLowerCase()
      );
      if (existing) {
        const updatedItems = state.items.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                stockQty: command.stockQty,
                sellingPrice: command.sellingPrice,
                wholesalePrice: command.wholesalePrice,
              }
            : i
        );
        return {
          state: { ...state, items: updatedItems },
          spokenResponse: `Updated ${command.name} to ${command.stockQty} ${command.unit === 'packet' ? 'packets' : 'kilos'} at ${command.sellingPrice} rupees.`,
          status: 'success',
        };
      }

      const newItem: KiranaItem = {
        id: `item-${command.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
        name: command.name,
        localLabel: 'Custom Kirana Item',
        synonyms: [command.name.toLowerCase()],
        unit: command.unit,
        stockQty: command.stockQty,
        drumCapacity: Math.max(25, command.stockQty),
        wholesalePrice: command.wholesalePrice,
        sellingPrice: command.sellingPrice,
        isLoose: command.unit !== 'packet',
        todaySoldQty: 0,
        todayRevenue: 0,
        todayWholesaleCost: 0,
        todayTaruguCost: 0,
      };
      const spokenResponse = `Added ${command.name}, ${command.stockQty} ${command.unit === 'packet' ? 'packets' : 'kilos'} at ${command.sellingPrice} rupees per ${command.unit === 'packet' ? 'packet' : 'kilo'}.`;
      return {
        state: { ...state, items: [...state.items, newItem] },
        spokenResponse,
        status: 'success',
      };
    }

    case 'bill_items': {
      let nextBill = [...state.activeBill];
      for (const parsed of command.items) {
        const item = state.items.find((i) => i.id === parsed.itemId);
        if (!item) continue;
        const line = createBillLine(item, parsed);
        nextBill = addOrUpdateBillLine(nextBill, line, Boolean(command.isCorrection));
      }

      const nextCustomerId = command.customerId ?? state.activeCustomerId;
      const intermediateState: AppState = {
        ...state,
        activeBill: nextBill,
        activeCustomerId: nextCustomerId,
      };

      if (command.finalizeBill) {
        const paymentMethod: PaymentMethod = nextCustomerId
          ? 'udhaar'
          : command.paymentMethod ?? 'cash';
        const finalized = finalizeActiveBill(intermediateState, paymentMethod, nextCustomerId);
        return {
          state: finalized.state,
          spokenResponse: finalized.spokenResponse,
          status: finalized.warning ? 'warning' : 'success',
        };
      }

      if (command.isCorrection && command.items[0]) {
        const c = command.items[0];
        const qtySpoken = c.unit === 'kg' && c.quantity >= 1 ? `${c.quantity} kilos` : c.displayQty;
        return {
          state: intermediateState,
          spokenResponse: `Updated ${c.itemName.toLowerCase()} to ${qtySpoken}.`,
          status: 'success',
        };
      }

      const addedText = command.items.map((i) => `${i.itemName} ${i.displayQty}`).join(', ');
      const billTotal = nextBill.reduce((s, l) => s + l.lineTotal, 0);
      return {
        state: intermediateState,
        spokenResponse: `Added ${addedText}. Current bill total is ${billTotal} rupees.`,
        status: 'success',
      };
    }

    case 'missing_demand': {
      const existing = state.missingDemand.find(
        (m) => m.name.toLowerCase() === command.itemName.toLowerCase()
      );
      const nextMissing = existing
        ? state.missingDemand.map((m) =>
            m.id === existing.id
              ? { ...m, requestedCount: m.requestedCount + 1, requestedAt: nowTimeString() }
              : m
          )
        : [
            {
              id: `demand-${Date.now()}`,
              name: command.itemName,
              requestedCount: 1,
              requestedAt: nowTimeString(),
              note: 'Voice flagged — customer asked at counter',
            },
            ...state.missingDemand,
          ];
      return {
        state: { ...state, missingDemand: nextMissing },
        spokenResponse: `${command.itemName} added to supply list.`,
        status: 'success',
      };
    }

    case 'udhaar_repayment': {
      let remaining = 0;
      const updatedAccounts = state.udhaarAccounts.map((acc) => {
        if (acc.id !== command.customerId) return acc;
        remaining = Math.max(0, Math.round(acc.balance - command.amount));
        return {
          ...acc,
          balance: remaining,
          lastUpdated: `Today, ${nowTimeString()}`,
          transactions: [
            {
              id: `tx-${Date.now()}`,
              timestamp: `Today, ${nowTimeString()}`,
              type: 'repayment' as const,
              amount: command.amount,
              method: command.method,
              note: `Voice repayment (${command.method.toUpperCase()})`,
            },
            ...acc.transactions,
          ],
        };
      });
      return {
        state: { ...state, udhaarAccounts: updatedAccounts },
        spokenResponse: `${command.customerName} remaining Udhaar is ${remaining} rupees.`,
        status: 'success',
      };
    }

    case 'log_spends': {
      const newSpends: DailySpend[] = command.spends.map((sp, idx) => ({
        id: `spend-${Date.now()}-${idx}`,
        label: sp.label,
        category: sp.category,
        amount: Math.round(sp.amount),
        timestamp: nowTimeString(),
      }));
      const nextState: AppState = {
        ...state,
        dailySpends: [...newSpends, ...state.dailySpends],
      };
      const profit = computeProfitSummary(nextState);
      const topLine = profit.topProfitItem
        ? `Top profit item: ${profit.topProfitItem.name} at ${profit.topProfitItem.todayNetProfit} rupees.`
        : '';
      const spokenResponse = command.askProfit
        ? `Sales ${profit.totalSales.toLocaleString('en-IN')} rupees, spends ${profit.totalSpends.toLocaleString('en-IN')} rupees, net profit ${profit.netProfit.toLocaleString('en-IN')} rupees. ${topLine}`
        : `Logged ${newSpends.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')} rupees spend. Today's net profit is ${profit.netProfit.toLocaleString('en-IN')} rupees.`;

      return {
        state: nextState,
        spokenResponse,
        status: 'success',
      };
    }

    case 'ask_profit': {
      const profit = computeProfitSummary(state);
      const topLine = profit.topProfitItem
        ? `Top profit item: ${profit.topProfitItem.name} at ${profit.topProfitItem.todayNetProfit} rupees.`
        : '';
      return {
        state,
        spokenResponse: `Sales ${profit.totalSales.toLocaleString('en-IN')} rupees, spends ${profit.totalSpends.toLocaleString('en-IN')} rupees, net profit ${profit.netProfit.toLocaleString('en-IN')} rupees. ${topLine}`,
        status: 'success',
      };
    }

    case 'disambiguate': {
      return {
        state: {
          ...state,
          pendingDisambiguation: command.pending,
          lastVoiceStatus: 'disambiguate',
        },
        spokenResponse: command.pending.promptText,
        status: 'disambiguate',
      };
    }

    case 'resolve_disambiguation': {
      const pending = state.pendingDisambiguation;
      if (!pending) {
        return { state, spokenResponse: 'No pending confirmation.', status: 'noise' };
      }
      if (command.choice === 'cancel') {
        return {
          state: { ...state, pendingDisambiguation: null, lastVoiceStatus: 'idle' },
          spokenResponse: 'Cancelled. Ready for next item.',
          status: 'success',
        };
      }
      const chosen = command.choice === 'primary' ? pending.primaryOption : pending.secondaryOption;
      let nextItems = state.items;
      let targetItem = chosen.itemId ? state.items.find((i) => i.id === chosen.itemId) : undefined;

      if (!targetItem) {
        // Add temporary catalog item for non-catalog rhyming choice like Salt
        targetItem = {
          id: `item-${chosen.itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          name: chosen.itemName,
          localLabel: 'Added via voice confirmation',
          synonyms: [chosen.itemName.toLowerCase()],
          unit: chosen.unit,
          stockQty: 15,
          drumCapacity: 25,
          wholesalePrice: 18,
          sellingPrice: 24,
          isLoose: chosen.unit !== 'packet',
          todaySoldQty: 0,
          todayRevenue: 0,
          todayWholesaleCost: 0,
          todayTaruguCost: 0,
        };
        nextItems = [...state.items, targetItem];
      }

      const line = createBillLine(targetItem, {
        itemId: targetItem.id,
        itemName: targetItem.name,
        quantity: chosen.quantity,
        unit: targetItem.unit,
        displayQty: chosen.displayQty,
        orderedByRupees: chosen.orderedByRupees,
      });
      const nextBill = addOrUpdateBillLine(state.activeBill, line, false);

      return {
        state: {
          ...state,
          items: nextItems,
          activeBill: nextBill,
          pendingDisambiguation: null,
          lastVoiceStatus: 'speaking',
        },
        spokenResponse: `Confirmed. Added ${chosen.displayQty} ${targetItem.name} to bill.`,
        status: 'success',
      };
    }

    case 'compound': {
      let curState = state;
      const responses: string[] = [];
      let worstStatus: VoiceLogEntry['status'] = 'success';

      for (const sub of command.commands) {
        const res = executeSingleCommand(curState, sub);
        curState = res.state;
        if (res.spokenResponse) responses.push(res.spokenResponse);
        if (res.status === 'disambiguate') worstStatus = 'disambiguate';
        else if (res.status === 'warning' && worstStatus === 'success') worstStatus = 'warning';
      }

      return {
        state: curState,
        spokenResponse: responses.join(' '),
        status: worstStatus,
      };
    }

    case 'noise':
    default: {
      return {
        state: { ...state, lastVoiceStatus: 'noise' },
        spokenResponse: 'Ignored background chatter — no Kirana item or command heard.',
        status: 'noise',
      };
    }
  }
}

export function processVoiceTranscript(
  state: AppState,
  transcript: string,
  options?: {
    confidence?: number;
    engine?: 'offline' | 'sarvam';
    detectedLang?: 'en-IN' | 'te-IN' | 'hi-IN';
  }
): { state: AppState; spokenResponse: string; command: VoiceCommand } {
  const confidence = options?.confidence ?? 0.95;
  const normalizedTranscript = normalizeIndianPhonetics(transcript);
  const wasPhoneticRepaired =
    normalizedTranscript.toLowerCase() !== transcript.trim().toLowerCase();
  const autoLang = options?.detectedLang ?? detectSpokenLanguage(normalizedTranscript).langCode;
  const command = parseVoiceUtterance(normalizedTranscript, state.items, state.udhaarAccounts, {
    confidence,
    pendingDisambiguation: state.pendingDisambiguation,
  });

  const executed = executeSingleCommand(state, command);
  const understoodTokens = summarizeParsedCommand(command);
  const logEntry: VoiceLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimeString(),
    transcript,
    response: executed.spokenResponse,
    status: executed.status,
    engine: options?.engine ?? 'offline',
  };

  const nextVoiceStatus: AppState['lastVoiceStatus'] =
    executed.status === 'disambiguate'
      ? 'disambiguate'
      : executed.status === 'noise'
      ? 'noise'
      : 'speaking';

  return {
    command,
    spokenResponse: executed.spokenResponse,
    state: {
      ...executed.state,
      voiceLang: autoLang,
      lastTranscript: transcript,
      lastSpokenResponse: executed.spokenResponse,
      lastVoiceStatus: nextVoiceStatus,
      lastVoiceClarity: {
        confidence,
        normalizedTranscript,
        wasPhoneticRepaired,
        understoodTokens,
      },
      voiceLogs: [logEntry, ...executed.state.voiceLogs].slice(0, 12),
    },
  };
}
