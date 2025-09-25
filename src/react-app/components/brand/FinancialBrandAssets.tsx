import type { ComponentType } from 'react';

export type LogoProps = { className?: string };

const createTextLogo = (
  text: string,
  options?: { fontSize?: number; letterSpacing?: number; fontWeight?: number }
): ComponentType<LogoProps> => {
  const { fontSize = 14, letterSpacing = 0, fontWeight = 600 } = options || {};
  const Component = ({ className }: LogoProps) => (
    <svg viewBox="0 0 64 24" className={className} role="img" aria-hidden="true">
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Inter', 'Segoe UI', sans-serif"
        fontSize={fontSize}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
      >
        {text}
      </text>
    </svg>
  );
  Component.displayName = `${text.replace(/\s+/g, '')}Logo`;
  return Component;
};

const NubankWordmark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 68 32" className={className} role="img" aria-hidden="true">
    <path
      d="M6.1 27.6c-3.3 0-4.6-2.2-4.6-5.6V9.3C1.5 5.8 3 3.4 6.5 3.4c2 0 3.8.9 5.1 2.5V3.9h5.4v23.7h-5.4V16.1c0-3.5-1.4-5.2-3.6-5.2-1.6 0-2.4.8-2.4 2.9v8.7c0 2.1.7 2.9 2.4 2.9h.7v4.2h-2.6zM36.8 27.6c-2.7 0-4.8-1.1-6.2-3.3v3h-5.4V3.9h5.4v7.5c1.4-2.2 3.5-3.3 6.2-3.3 4.2 0 6.5 2.6 6.5 6.9v5.7c0 4.3-2.3 6.9-6.5 6.9zm-1.6-16c-1.8 0-3.2 1-3.2 3.6v5.1c0 2.6 1.4 3.6 3.2 3.6s3.2-1 3.2-3.6v-5.1c0-2.6-1.4-3.6-3.2-3.6z"
      fill="currentColor"
    />
  </svg>
);
NubankWordmark.displayName = 'NubankLogo';

const BradescoMark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden="true">
    <defs>
      <linearGradient id="bradescoGradient" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#ff5f6d" />
        <stop offset="100%" stopColor="#ff1f3d" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#bradescoGradient)" />
    <path
      d="M32 18c-6.5 0-11.5 3.1-13.8 8.6h4.9c1.8-3.1 4.7-4.5 8.9-4.5 4.8 0 8.4 2.4 8.4 7 0 3.3-2 6.3-6.4 6.3-2.5 0-4.6-1-6.2-2.5l-3.9 2.2V46h5.2v-7.6c1.6 1 3.4 1.5 5.4 1.5 7 0 11.8-4.8 11.8-11.8C45.3 22.3 39.8 18 32 18z"
      fill="#fff"
    />
    <circle cx="32" cy="46" r="5" fill="#fff" />
  </svg>
);
BradescoMark.displayName = 'BradescoLogo';

const ItauWordmark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden="true">
    <rect width="64" height="64" rx="18" fill="#003399" />
    <rect x="4" y="4" width="56" height="56" rx="14" fill="#ff8c00" />
    <text
      x="32"
      y="37"
      textAnchor="middle"
      fill="#003399"
      fontFamily="'Inter', 'Segoe UI', sans-serif"
      fontSize="20"
      fontWeight="700"
    >
      Itaú
    </text>
  </svg>
);
ItauWordmark.displayName = 'ItauLogo';

const BancoDoBrasilMark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#ffd400" />
    <path
      d="M46 20.5 32 29.7 18 20.5l6.8-4.4L32 21l7.2-4.9L46 20.5zm0 23L32 34.3 18 43.5l6.8 4.4L32 43l7.2 4.9 6.8-4.4zm-14-9.5 7.2 4.9 6.8-4.4-14-9.2-14 9.2 6.8 4.4 7.2-4.9z"
      fill="#003399"
    />
  </svg>
);
BancoDoBrasilMark.displayName = 'BancoDoBrasilLogo';

const SantanderMark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#ed1b24" />
    <path
      d="M33.8 17c.6 4.3-.7 6.9-2.5 10.3-1.5 2.9-3.1 6.2-2.4 10.5 1.2-1.8 3.7-3.1 6-3.1 3.7 0 6.7 2.6 6.7 6.3 0 4.7-4 6.9-8.7 6.9-5.9 0-10.7-3.4-10.7-8.6 0-3.7 2-6.3 4.1-9 2.6-3.5 5.3-7.3 3.9-13.3 1.2.3 2.6.6 3.6 1z"
      fill="#fff"
    />
  </svg>
);
SantanderMark.displayName = 'SantanderLogo';

const CaixaMark = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-hidden="true">
    <rect width="64" height="64" rx="16" fill="#003399" />
    <path d="M14 20h12l6 8-6 8H14l6-8-6-8z" fill="#f7941d" />
    <path d="M38 20h12l-6 8 6 8H38l-6-8 6-8z" fill="#f7941d" opacity="0.8" />
  </svg>
);
CaixaMark.displayName = 'CaixaLogo';

const InterWordmark = createTextLogo('Inter', { fontSize: 16, fontWeight: 700 });
const PicPayWordmark = createTextLogo('PicPay', { fontSize: 16, fontWeight: 700 });
const C6Wordmark = createTextLogo('C6 Bank', { fontSize: 14, fontWeight: 600 });

const VisaLogo = ({ className }: LogoProps) => (
  <svg viewBox="0 0 80 24" className={className} role="img" aria-hidden="true">
    <path d="M34.2 23.4h-6.2l3.9-22.9h6.2l-3.9 22.9zm-9.4-22.9-6 15.7-.7-3.5-2.1-10.8S14.8.5 12.3.5H1.2L1 1.4s3.5.8 6.1 3.6c2.9 2.8 3.8 4.7 3.8 4.7l4.8 13.7h6.5l10-22.9h-7.4zM52.6 6.5c-2.7-1.3-4.5-2.2-4.5-3.4.1-1.2 1.4-2 4.5-2 2.5-.1 4.5.4 6 .8l.7.2 1-5.6C58.9-.3 56.2-.9 53 1c-6.3 3-6.3 10.5-2.3 13.7 2.2 1.8 5.5 2.8 4.8 4.6-.4 2-3.3 1.9-6.3 1.8-1.5 0-2.7-.2-3.5-.3l-.8-.2-1.1 6.1c1.4.3 3.5.5 5.9.5 6.2 0 10.2-3 10.2-7.6.1-5.7-7.9-6.1-7.3-8.1.2-1.4 2.2-1.5 4.1-1.5 1.4 0 2.7.2 3.5.4l.7.1.7-5.8c-.9-.3-2.5-.8-5.6-.8-5.8-.2-9.7 2.7-9.8 7.2 0 3.2 3 5 5.3 6 2.3 1.1 3.1 1.8 3 2.9-.1 1.5-1.9 2.2-3.7 2.2-2.5 0-3.9-.4-5-.8l-.7-.2-.9 5.7c1.2.3 3.2.6 5.4.6 5.6 0 9.7-2.8 9.8-7.2.1-5.3-6.9-5.7-6.8-7.9.1-1.1 1.4-1.4 3.3-1.4 1.7 0 2.9.3 3.8.5l.6.1.9-5.6c-1.2-.3-2.9-.7-5.1-.7-6.5 0-9.6 3.1-9.7 6.6z"
      fill="currentColor"
    />
  </svg>
);
VisaLogo.displayName = 'VisaLogo';

const MastercardLogo = ({ className }: LogoProps) => (
  <svg viewBox="0 0 72 24" className={className} role="img" aria-hidden="true">
    <circle cx="27" cy="12" r="10" fill="#eb001b" />
    <circle cx="45" cy="12" r="10" fill="#f79e1b" />
    <path d="M33 12a9.9 9.9 0 0 1 4.5-8.3 9.9 9.9 0 0 0 0 16.6A9.9 9.9 0 0 1 33 12z" fill="#ff5f00" />
  </svg>
);
MastercardLogo.displayName = 'MastercardLogo';

const EloLogo = ({ className }: LogoProps) => (
  <svg viewBox="0 0 64 24" className={className} role="img" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#231f20" />
    <path d="M11.8 7.2 9 9.5l2.8 2.3 2.8-2.3-2.8-2.3z" fill="#00a8e0" />
    <path d="M11.8 16.8 9 14.5l2.8-2.3 2.8 2.3-2.8 2.3z" fill="#f6b800" />
    <path d="M19 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="#231f20" strokeWidth="3" fill="none" />
  </svg>
);
EloLogo.displayName = 'EloLogo';

const AmexLogo = ({ className }: LogoProps) => (
  <svg viewBox="0 0 96 28" className={className} role="img" aria-hidden="true">
    <rect width="96" height="28" rx="6" fill="#2678b6" />
    <text
      x="48"
      y="18"
      textAnchor="middle"
      fill="#fff"
      fontFamily="'Inter', 'Segoe UI', sans-serif"
      fontSize="12"
      fontWeight="700"
      letterSpacing="3"
    >
      AMEX
    </text>
  </svg>
);
AmexLogo.displayName = 'AmexLogo';

const DefaultNetworkLogo = createTextLogo('Card', { fontSize: 12, fontWeight: 600 });

export type CardNetworkId = 'visa' | 'mastercard' | 'elo' | 'amex' | 'default';

const CARD_NETWORKS: Record<CardNetworkId, { label: string; logo: ComponentType<LogoProps> }> = {
  visa: { label: 'Visa', logo: VisaLogo },
  mastercard: { label: 'Mastercard', logo: MastercardLogo },
  elo: { label: 'Elo', logo: EloLogo },
  amex: { label: 'American Express', logo: AmexLogo },
  default: { label: 'Cartão', logo: DefaultNetworkLogo },
};

const CARD_NETWORK_KEYWORDS: { id: CardNetworkId; keywords: string[] }[] = [
  { id: 'visa', keywords: ['visa'] },
  { id: 'mastercard', keywords: ['mastercard', 'master card'] },
  { id: 'elo', keywords: ['elo'] },
  { id: 'amex', keywords: ['amex', 'american express'] },
];

export interface CardVisualConfig {
  id: string;
  label: string;
  keywords: string[];
  gradient: string;
  accent: string;
  patternColor: string;
  highlightGradient: string;
  issuerLogo: ComponentType<LogoProps>;
  defaultNetwork?: CardNetworkId;
}

const CARD_VISUALS: CardVisualConfig[] = [
  {
    id: 'nubank',
    label: 'Nubank',
    keywords: ['nubank', 'nu bank', 'roxo'],
    gradient: 'from-[#3b0d72] via-[#5d15a3] to-[#8c3fff]',
    accent: 'text-white',
    patternColor: 'from-white/10 via-white/5 to-transparent',
    highlightGradient: 'from-white/25 to-white/10',
    issuerLogo: NubankWordmark,
    defaultNetwork: 'mastercard',
  },
  {
    id: 'itau',
    label: 'Itaú',
    keywords: ['itau', 'itaú'],
    gradient: 'from-[#00205b] via-[#003399] to-[#fd8b2c]',
    accent: 'text-white',
    patternColor: 'from-white/20 via-white/10 to-transparent',
    highlightGradient: 'from-white/35 to-white/10',
    issuerLogo: ItauWordmark,
    defaultNetwork: 'visa',
  },
  {
    id: 'bradesco',
    label: 'Bradesco',
    keywords: ['bradesco'],
    gradient: 'from-[#6b0f1a] via-[#b91350] to-[#f93d66]',
    accent: 'text-white',
    patternColor: 'from-white/25 via-white/10 to-transparent',
    highlightGradient: 'from-white/25 to-white/5',
    issuerLogo: BradescoMark,
    defaultNetwork: 'visa',
  },
  {
    id: 'santander',
    label: 'Santander',
    keywords: ['santander'],
    gradient: 'from-[#7b0006] via-[#c50712] to-[#ff3043]',
    accent: 'text-white',
    patternColor: 'from-white/20 via-white/10 to-transparent',
    highlightGradient: 'from-white/30 to-white/5',
    issuerLogo: SantanderMark,
    defaultNetwork: 'visa',
  },
  {
    id: 'caixa',
    label: 'Caixa',
    keywords: ['caixa'],
    gradient: 'from-[#002878] via-[#003e9f] to-[#007bff]',
    accent: 'text-white',
    patternColor: 'from-white/15 via-white/8 to-transparent',
    highlightGradient: 'from-white/20 to-white/5',
    issuerLogo: CaixaMark,
    defaultNetwork: 'elo',
  },
  {
    id: 'c6',
    label: 'C6 Bank',
    keywords: ['c6'],
    gradient: 'from-[#1c1c1c] via-[#2f2f2f] to-[#4a4a4a]',
    accent: 'text-white',
    patternColor: 'from-white/20 via-white/5 to-transparent',
    highlightGradient: 'from-white/15 to-white/5',
    issuerLogo: C6Wordmark,
    defaultNetwork: 'mastercard',
  },
  {
    id: 'inter',
    label: 'Inter',
    keywords: ['inter'],
    gradient: 'from-[#f97316] via-[#fb923c] to-[#fdba74]',
    accent: 'text-slate-900',
    patternColor: 'from-white/40 via-white/30 to-transparent',
    highlightGradient: 'from-white/40 to-white/10',
    issuerLogo: InterWordmark,
    defaultNetwork: 'visa',
  },
];

const fallbackCardVisual: CardVisualConfig = {
  id: 'default',
  label: 'Cartão',
  keywords: [],
  gradient: 'from-slate-800 via-slate-900 to-slate-950',
  accent: 'text-white',
  patternColor: 'from-white/10 via-white/5 to-transparent',
  highlightGradient: 'from-white/20 to-white/5',
  issuerLogo: createTextLogo('Card', { fontSize: 12 }),
  defaultNetwork: 'default',
};

export const POPULAR_BANK_BRANDS = [
  {
    id: 'nubank',
    label: 'Nubank',
    keywords: ['nubank', 'nu'],
    badgeGradient: 'from-[#7e22ce] via-[#8b5cf6] to-[#a855f7]',
    logo: NubankWordmark,
  },
  {
    id: 'itau',
    label: 'Itaú',
    keywords: ['itau', 'itaú'],
    badgeGradient: 'from-[#ffb347] via-[#fd8b2c] to-[#ff6a00]',
    logo: ItauWordmark,
  },
  {
    id: 'bradesco',
    label: 'Bradesco',
    keywords: ['bradesco'],
    badgeGradient: 'from-[#f97373] via-[#ef4444] to-[#dc2626]',
    logo: BradescoMark,
  },
  {
    id: 'banco-do-brasil',
    label: 'Banco do Brasil',
    keywords: ['banco do brasil', 'bb'],
    badgeGradient: 'from-[#facc15] via-[#fbbf24] to-[#f59e0b]',
    logo: BancoDoBrasilMark,
  },
  {
    id: 'santander',
    label: 'Santander',
    keywords: ['santander'],
    badgeGradient: 'from-[#ef4444] via-[#dc2626] to-[#b91c1c]',
    logo: SantanderMark,
  },
  {
    id: 'caixa',
    label: 'Caixa',
    keywords: ['caixa'],
    badgeGradient: 'from-[#3b82f6] via-[#2563eb] to-[#1d4ed8]',
    logo: CaixaMark,
  },
  {
    id: 'inter',
    label: 'Inter',
    keywords: ['inter'],
    badgeGradient: 'from-[#fb923c] via-[#f97316] to-[#ea580c]',
    logo: InterWordmark,
  },
  {
    id: 'picpay',
    label: 'PicPay',
    keywords: ['picpay'],
    badgeGradient: 'from-[#34d399] via-[#10b981] to-[#047857]',
    logo: PicPayWordmark,
  },
  {
    id: 'c6',
    label: 'C6 Bank',
    keywords: ['c6'],
    badgeGradient: 'from-[#4b5563] via-[#374151] to-[#111827]',
    logo: C6Wordmark,
  },
];

export interface BankVisualConfig {
  id: string;
  label: string;
  keywords: string[];
  badgeGradient: string;
  logo: ComponentType<LogoProps>;
}

const fallbackBankVisual: BankVisualConfig = {
  id: 'default',
  label: 'Instituição',
  keywords: [],
  badgeGradient: 'from-slate-200 via-slate-300 to-slate-400',
  logo: createTextLogo('Bank', { fontSize: 12 }),
};

export const getCardVisualConfig = (name?: string | null): CardVisualConfig => {
  if (!name) return fallbackCardVisual;
  const normalized = name.toLowerCase();
  return (
    CARD_VISUALS.find(visual => visual.keywords.some(keyword => normalized.includes(keyword))) || fallbackCardVisual
  );
};

export const getBankVisualConfig = (name?: string | null): BankVisualConfig => {
  if (!name) return fallbackBankVisual;
  const normalized = name.toLowerCase();
  return (
    POPULAR_BANK_BRANDS.find(visual => visual.keywords.some(keyword => normalized.includes(keyword))) || fallbackBankVisual
  );
};

export const getCardNetworkVisual = (
  name?: string | null,
  fallback?: CardNetworkId
): { id: CardNetworkId; label: string; logo: ComponentType<LogoProps> } => {
  const normalized = name?.toLowerCase() ?? '';
  const detected = CARD_NETWORK_KEYWORDS.find(network =>
    network.keywords.some(keyword => normalized.includes(keyword))
  );
  const networkId = detected?.id || fallback || 'default';
  const network = CARD_NETWORKS[networkId];
  return { id: networkId, ...network };
};

export const resolveAvailableBankOption = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return POPULAR_BANK_BRANDS.find(option => option.keywords.some(keyword => normalized.includes(keyword))) || null;
};

export const bankOptionsForForm = POPULAR_BANK_BRANDS.slice(0, 8);

export type LogoRenderer = ComponentType<LogoProps>;
