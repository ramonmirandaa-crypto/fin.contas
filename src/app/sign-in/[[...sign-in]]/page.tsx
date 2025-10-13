import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 py-12 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm font-semibold py-2',
            },
          }}
        />
      </div>
    </div>
  );
}
