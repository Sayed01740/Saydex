import React from 'react';
import { useProtocol } from '../../context/ProtocolContext';
import { ArrowLeftRight, Compass, Droplets, Wallet } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeView, setActiveView } = useProtocol();

  const items = [
    { id: 'swap', label: 'Trade', icon: ArrowLeftRight },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'pools', label: 'Pools', icon: Droplets },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  ] as const;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-app)] px-4 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id || (item.id === 'pools' && activeView === 'positions');
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-[var(--primary)] font-semibold scale-105'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
