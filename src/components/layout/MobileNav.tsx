import React from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { ArrowLeftRight, Compass, Droplet, WalletCards, Wallet, BarChart3, Flame, Cpu } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView } = useProtocol();

  const items = [
    { id: 'swap', label: 'Trade', icon: ArrowLeftRight },
    { id: 'router', label: 'Router', icon: Cpu },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'pools', label: 'Pools', icon: Droplet },
    { id: 'fees', label: 'Fees', icon: Flame },
    { id: 'positions', label: 'Positions', icon: WalletCards },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
  ] as const;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-app)] px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
              isActive
                ? 'text-[var(--primary)] font-semibold'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px] mt-0.5 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

