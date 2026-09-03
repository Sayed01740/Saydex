import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  CreditCard,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Token } from '../../types';
import { useWallet } from '../../context/WalletContext';

interface FiatOnRampModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultToken?: Token;
}

const FIAT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 1.08 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 1.29 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rateToUSD: 0.73 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', rateToUSD: 0.65 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', rateToUSD: 0.0084 },
];

const SUPPORTED_FIAT_CRYPTOS = [
  { symbol: 'ETH', name: 'Ethereum', priceUSD: 2424.65, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { symbol: 'USDC', name: 'USD Coin', priceUSD: 1.0, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png' },
  { symbol: 'USDT', name: 'Tether USD', priceUSD: 1.0, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png' },
  { symbol: 'WBTC', name: 'Wrapped BTC', priceUSD: 78660.0, icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png' },
];

export const FiatOnRampModal: React.FC<FiatOnRampModalProps> = ({
  isOpen,
  onClose,
  defaultToken,
}) => {
  const { address } = useWallet();
  const [fiatAmount, setFiatAmount] = useState('250');
  const [selectedFiat, setSelectedFiat] = useState(FIAT_CURRENCIES[0]);
  const initialCrypto = defaultToken && SUPPORTED_FIAT_CRYPTOS.some((c) => c.symbol === defaultToken.symbol.toUpperCase())
    ? defaultToken.symbol.toUpperCase()
    : 'ETH';
  const [selectedCryptoSym, setSelectedCryptoSym] = useState(initialCrypto);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedCryptoObj = SUPPORTED_FIAT_CRYPTOS.find((c) => c.symbol === selectedCryptoSym) || SUPPORTED_FIAT_CRYPTOS[0];
  const fiatValInUSD = (parseFloat(fiatAmount) || 0) * selectedFiat.rateToUSD;
  const estimatedCryptoOut = fiatValInUSD > 0 ? (fiatValInUSD / selectedCryptoObj.priceUSD).toFixed(4) : '0.00';

  const userRecipientAddress = address || '0x38D6F3921B5D343b67Ce847c2F1e5D6bE4929810';

  const handleLaunchOnRamp = () => {
    setIsProcessing(true);

    // Uniswap official production Buy Gateway URL with preselected currency
    const uniswapBuyUrl = `https://app.uniswap.org/buy?currency=${selectedCryptoSym.toLowerCase()}`;

    setTimeout(() => {
      setIsProcessing(false);
      window.open(uniswapBuyUrl, '_blank', 'noopener,noreferrer,width=560,height=760');
      setIsSuccess(true);
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/15 text-pink-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <span>Uniswap Fiat Gateway</span>
        </div>
      }
      subtitle="Official Uniswap card on-ramp powered by MoonPay & Stripe for instant Visa / Mastercard purchases"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Gateway Security Banner */}
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-pink-300 font-semibold">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Official Uniswap On-Ramp Partner Gateway</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono font-bold">
            Live 🟢
          </span>
        </div>

        {/* Step 1: Input Fiat Amount */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>You Pay (Fiat)</span>
            <div className="flex items-center gap-1 font-mono">
              {[100, 250, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFiatAmount(preset.toString())}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] hover:border-pink-500 text-[var(--text-secondary)] hover:text-pink-400 cursor-pointer font-semibold"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="number"
              value={fiatAmount}
              onChange={(e) => {
                setFiatAmount(e.target.value);
                setIsSuccess(false);
              }}
              placeholder="0.00"
              className="w-full text-2xl font-bold bg-transparent text-[var(--text-primary)] focus:outline-none"
            />
            <div className="relative">
              <select
                value={selectedFiat.code}
                onChange={(e) => {
                  const found = FIAT_CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setSelectedFiat(found);
                }}
                className="appearance-none px-3 py-1.5 pr-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs font-bold text-[var(--text-primary)] cursor-pointer focus:outline-none"
              >
                {FIAT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>

        {/* Conversion Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="p-1.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-[var(--text-tertiary)] shadow-xs">
            <ArrowRight className="w-3.5 h-3.5 rotate-90 text-pink-400" />
          </div>
        </div>

        {/* Step 2: Estimated Crypto Out */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
            <span>You Receive (Estimated)</span>
            <span>1 {selectedCryptoSym} ≈ ${selectedCryptoObj.priceUSD.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-pink-400 font-mono">
              {estimatedCryptoOut}
            </span>
            <div className="relative">
              <select
                value={selectedCryptoSym}
                onChange={(e) => setSelectedCryptoSym(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-app)] text-xs font-bold text-[var(--text-primary)] cursor-pointer focus:outline-none"
              >
                {SUPPORTED_FIAT_CRYPTOS.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} - {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>

        {/* Destination Wallet Bar */}
        <div className="p-2.5 rounded-xl bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Wallet className="w-3.5 h-3.5 text-pink-400" />
            <span>Destination:</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold truncate max-w-[200px]">
              {userRecipientAddress}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Direct Delivery
          </span>
        </div>

        {/* Payment Methods Supported */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-subtle)]/40 border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Visa, Mastercard, Apple Pay, Google Pay</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <span>Direct Settlement</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleLaunchOnRamp}
          disabled={isProcessing || parseFloat(fiatAmount) <= 0}
          className="w-full justify-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 text-sm shadow-md"
        >
          {isProcessing ? (
            <span>Connecting Uniswap Gateway...</span>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Uniswap Gateway Opened in New Tab</span>
            </>
          ) : (
            <>
              <span>Continue on Official Uniswap Gateway</span>
              <ExternalLink className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
