import { RedirectToSignIn, SignedIn, SignedOut, UserProfile } from '@clerk/clerk-react';
import AuthShell from './AuthShell';

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <SignedIn>
        <div className="mx-auto max-w-3xl rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur-xl border border-white/20">
          <UserProfile
            path="/user-profile"
            routing="path"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-white/95 shadow-xl border border-white/40 backdrop-blur text-slate-900',
              },
            }}
          />
        </div>
      </SignedIn>
      <SignedOut>
        <AuthShell title="Faça login para gerenciar seu perfil">
          <RedirectToSignIn />
        </AuthShell>
      </SignedOut>
    </div>
  );
}
