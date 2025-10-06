import { useId } from 'react';
import clsx from 'clsx';

export type FinContasLogoProps = {
  className?: string;
  wordmarkClassName?: string;
  orientation?: 'horizontal' | 'vertical';
  showWordmark?: boolean;
};

export default function FinContasLogo({
  className,
  wordmarkClassName,
  orientation = 'horizontal',
  showWordmark = true,
}: FinContasLogoProps) {
  const generatedId = useId();
  const gradientId = `${generatedId}-gradient`;
  const containerClass = clsx(
    'inline-flex items-center',
    orientation === 'horizontal' ? 'flex-row gap-3' : 'flex-col gap-3',
    className
  );

  return (
    <span className={containerClass}>
      <svg
        className={orientation === 'horizontal' ? 'h-12 w-12' : 'h-14 w-14'}
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${gradientId})`} />
        <path
          d="M19 22c0-2.209 1.791-4 4-4h15c2.21 0 4 1.791 4 4s-1.79 4-4 4H27v6h9c2.21 0 4 1.79 4 4s-1.79 4-4 4h-9v6h12c2.21 0 4 1.79 4 4s-1.79 4-4 4H23c-2.209 0-4-1.79-4-4V22Z"
          fill="#f8fafc"
        />
        <path
          d="M33 30c0-4.418 3.582-8 8-8h2c7.732 0 14 6.268 14 14s-6.268 14-14 14h-2c-4.418 0-8-3.582-8-8 0-4.419 3.582-8 8-8h2c1.105 0 2 .895 2 2s-.895 2-2 2h-2c-2.209 0-4 1.791-4 4s1.791 4 4 4h2c5.523 0 10-4.477 10-10s-4.477-10-10-10h-2c-2.209 0-4 1.791-4 4 0 1.105-.895 2-2 2s-2-.895-2-2Z"
          fill="#e0f2fe"
        />
      </svg>
      {showWordmark && (
        <span
          className={clsx(
            'font-semibold tracking-tight',
            orientation === 'horizontal' ? 'text-lg' : 'text-xl text-center leading-tight',
            wordmarkClassName ?? 'text-slate-900'
          )}
        >
          Fin
          <span className="text-blue-600">Contas</span>
        </span>
      )}
    </span>
  );
}
