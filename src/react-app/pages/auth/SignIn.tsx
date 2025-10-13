import { SignIn } from '@clerk/clerk-react';
import AuthShell from './AuthShell';

export default function SignInPage() {
  return (
    <AuthShell title="Acesse sua conta" subtitle="Use suas credenciais do Clerk para continuar.">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm font-semibold py-2',
          },
        }}
      />
    </AuthShell>
  );
}
