import type { PropsWithChildren, ReactNode } from 'react';

interface AuthShellProps {
  title: ReactNode;
  subtitle?: ReactNode;
}

export default function AuthShell({ children, title, subtitle }: PropsWithChildren<AuthShellProps>) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white/90">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
        </div>
        <div className="rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur-xl border border-white/20">
          {children}
        </div>
      </div>
    </div>
  );
}
