import {
  ClipboardList,
  Cloud,
  Compass,
  Package,
  ReceiptIndianRupee,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Users,
} from 'lucide-react';
import { PrivacyMode, TabId } from '../engine/types';
import { ManaKiranaLogo } from './ManaKiranaLogo';

interface TopBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  privacyMode: PrivacyMode;
  onTogglePrivacyMode: (mode: PrivacyMode) => void;
  onOpenQuickTour: () => void;
  refillCount: number;
  activeBillCount: number;
  isListening?: boolean;
}

const NAV_ITEMS: Array<{ id: TabId; label: string; shortLabel: string; icon: typeof ReceiptIndianRupee }> = [
  { id: 'counter', label: 'Counter', shortLabel: 'Counter', icon: ReceiptIndianRupee },
  { id: 'stock', label: 'Drum Stock', shortLabel: 'Stock', icon: Package },
  { id: 'refill', label: 'Refill List', shortLabel: 'Refill', icon: ClipboardList },
  { id: 'udhaar', label: 'Udhaar', shortLabel: 'Udhaar', icon: Users },
  { id: 'profit', label: 'Profit Dash', shortLabel: 'Profit', icon: TrendingUp },
];

export function TopBar({
  activeTab,
  onSelectTab,
  privacyMode,
  onTogglePrivacyMode,
  onOpenQuickTour,
  refillCount,
  activeBillCount,
  isListening = false,
}: TopBarProps) {
  const isProfileActive = activeTab === 'profile';

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F5F5F7]/90 backdrop-blur-md border-b border-black/[0.06]">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-5">
          {/* Zone 1: Official Talking Shopfront Logo + Single-line Brand wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('counter')}
            className="inline-flex items-center gap-1.5 sm:gap-2.5 font-display text-base sm:text-xl font-extrabold tracking-tight text-[#1D1D1F] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-xl pr-0.5 sm:pr-1"
          >
            <ManaKiranaLogo size={42} isListening={isListening} className="shrink-0" />
            <span>ManaKirana</span>
          </button>

          {/* Zone 2: 5 concise single-line nav links (desktop) */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-4 lg:gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const count =
                item.id === 'refill'
                  ? refillCount
                  : item.id === 'counter'
                  ? activeBillCount
                  : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative py-5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded ${
                    isActive
                      ? 'text-[#0F766E]'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span className="ml-1.5 font-mono text-xs tabular-nums text-[#DC2626]">
                      ({count})
                    </span>
                  )}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0F766E] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Privacy Mode toggle + Quick Tour + Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div
              role="group"
              aria-label="Data storage mode"
              className="flex items-center p-0.5 sm:p-1 bg-black/[0.05] rounded-xl shrink-0"
            >
              <button
                type="button"
                onClick={() => onTogglePrivacyMode('phone-only')}
                aria-pressed={privacyMode === 'phone-only'}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  privacyMode === 'phone-only'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <ShieldCheck className="hidden sm:inline w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
                <span className="hidden xl:inline">100% Phone-Only Privacy Mode</span>
                <span className="xl:hidden">Phone</span>
              </button>
              <button
                type="button"
                onClick={() => onTogglePrivacyMode('cloud-sync')}
                aria-pressed={privacyMode === 'cloud-sync'}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  privacyMode === 'cloud-sync'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <Cloud className="hidden sm:inline w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
                <span className="hidden xl:inline">Optional Cloud Sync</span>
                <span className="xl:hidden">Cloud</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="nav-tour-btn"
              onClick={onOpenQuickTour}
              aria-label="Open Quick Start Tour Guide"
              className="h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 bg-white text-[#1D1D1F] border border-black/[0.08] hover:border-[#0F766E]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
            >
              <Compass className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            <button
              type="button"
              data-testid="nav-profile-btn"
              onClick={() => onSelectTab('profile')}
              aria-label="Open Profile and Output Voice Settings"
              aria-current={isProfileActive ? 'page' : undefined}
              className={`h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                isProfileActive
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-white text-[#1D1D1F] border border-black/[0.08] hover:border-[#0F766E]/40'
              }`}
            >
              <UserCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation (compact 56px to stay comfortably under 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-black/[0.08]"
      >
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-1 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-[#0F766E]' : 'text-[#6E6E73]'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
