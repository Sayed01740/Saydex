import React from 'react';
import { useProtocol } from './context/ProtocolContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { SwapTerminalView } from './components/swap/SwapTerminalView';
import { ExploreView } from './components/explore/ExploreView';
import { PoolsView } from './components/pools/PoolsView';
import { PortfolioView } from './components/portfolio/PortfolioView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { activeView } = useProtocol();

  const renderActiveView = () => {
    switch (activeView) {
      case 'swap':
        return <SwapTerminalView />;
      case 'explore':
        return <ExploreView />;
      case 'pools':
      case 'positions':
        return <PoolsView />;
      case 'portfolio':
        return <PortfolioView />;
      default:
        return <SwapTerminalView />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] font-sans flex flex-col justify-between selection:bg-[var(--primary)] selection:text-[#090B0E]">
      {/* Top Protocol Navbar */}
      <Navbar />

      {/* Main Content Area with View Transition */}
      <main className="flex-1 pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView === 'positions' ? 'pools' : activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Toast Notifications Container */}
      <ToastContainer />
    </div>
  );
}
