import { useCallback, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import FeatureHighlights from '@/react-app/components/sections/FeatureHighlights';
import HeroSection from '@/react-app/components/sections/HeroSection';
import FinancePreviewSection, { OverlayView } from '@/react-app/components/sections/FinancePreviewSection';
import CallToActionSection from '@/react-app/components/sections/CallToActionSection';
import ExperienceOverlay from '@/react-app/components/layout/ExperienceOverlay';
import LoginPrompt from '@/react-app/components/LoginPrompt';
import { useExpenses } from '@/react-app/hooks/useExpenses';
import { HIGHLIGHT_ITEMS, buildOverlayConfig } from './homeConfig';
import type { CreateExpense } from '@/shared/types';

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [refreshInsights, setRefreshInsights] = useState(0);
  const [activeOverlay, setActiveOverlay] = useState<OverlayView | null>(null);

  const userName = useMemo(() => {
    if (!user) {
      return null;
    }

    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      return fullName;
    }

    return user.primaryEmailAddress?.emailAddress ?? null;
  }, [user]);

  const { expenses, submitting, metrics, addExpense } = useExpenses({ enabled: Boolean(user && isSignedIn) });
  const { totalExpenses, thisMonthExpenses, avgDailySpending } = metrics;

  const handleRefreshInsights = useCallback(() => {
    setRefreshInsights(previous => previous + 1);
  }, []);

  const handleAddExpense = useCallback(
    (expenseData: CreateExpense) => {
      void addExpense(expenseData).then(newExpense => {
        if (newExpense) {
          setRefreshInsights(previous => previous + 1);
        }
      });
    },
    [addExpense]
  );

  const handleOpenOverlay = useCallback((view: OverlayView) => {
    setActiveOverlay(view);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const overlayConfig = useMemo(
    () =>
      buildOverlayConfig({
        expenses,
        onAddExpense: handleAddExpense,
        submitting,
        refreshInsights,
      }),
    [expenses, handleAddExpense, submitting, refreshInsights]
  );

  const activeOverlayConfig = activeOverlay ? overlayConfig[activeOverlay] : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 rounded-3xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <LoginPrompt />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-20%] h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute right-[-15%] bottom-[-10%] h-[520px] w-[520px] rounded-full bg-cyan-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="bg-grid opacity-50" aria-hidden="true" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 pb-24 sm:px-6 lg:px-8">
        <HeroSection
          userName={userName}
          onRefreshInsights={handleRefreshInsights}
          onOpenOverlay={handleOpenOverlay}
          thisMonthExpenses={thisMonthExpenses}
          totalExpenses={totalExpenses}
        />

        <FeatureHighlights items={HIGHLIGHT_ITEMS} />

        <FinancePreviewSection
          expenses={expenses}
          thisMonthExpenses={thisMonthExpenses}
          totalExpenses={totalExpenses}
          avgDailySpending={avgDailySpending}
          onOpenOverlay={handleOpenOverlay}
        />

        <CallToActionSection onOpenOverlay={handleOpenOverlay} />
      </div>

      {activeOverlayConfig && (
        <ExperienceOverlay
          open={Boolean(activeOverlay)}
          onClose={handleCloseOverlay}
          title={activeOverlayConfig.title}
          description={activeOverlayConfig.description}
          icon={activeOverlayConfig.icon}
        >
          {activeOverlayConfig.render()}
        </ExperienceOverlay>
      )}
    </div>
  );
}
