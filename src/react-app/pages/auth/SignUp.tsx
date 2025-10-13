import { SignUp } from '@clerk/clerk-react';
import AuthShell from './AuthShell';

export default function SignUpPage() {
  return (
    <AuthShell title="Crie sua conta" subtitle="Registre-se gratuitamente em poucos segundos.">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm font-semibold py-2',
          },
        }}
      />
    </AuthShell>
  );
}
