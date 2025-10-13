import { UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 py-12 px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <UserProfile
          path="/user-profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-white/95 shadow-xl border border-white/40 backdrop-blur',
            },
          }}
        />
      </div>
    </div>
  );
}
