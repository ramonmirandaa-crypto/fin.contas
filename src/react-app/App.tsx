import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkLoaded, ClerkLoading } from "@clerk/clerk-react";
import HomePage from "@/react-app/pages/Home";
import SignInPage from "@/react-app/pages/auth/SignIn";
import SignUpPage from "@/react-app/pages/auth/SignUp";
import UserProfilePage from "@/react-app/pages/auth/UserProfile";
import ConnectivityBoundary from "@/react-app/components/layout/ConnectivityBoundary";
import { NetworkStatusProvider } from "@/react-app/components/providers/NetworkStatusProvider";

export default function App() {
  return (
    <NetworkStatusProvider>
      <BrowserRouter>
        <ConnectivityBoundary>
          <ClerkLoading>
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
              <div className="animate-pulse">
                <div className="h-32 w-32 rounded-3xl bg-white/10" />
              </div>
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/user-profile/*" element={<UserProfilePage />} />
            </Routes>
          </ClerkLoaded>
        </ConnectivityBoundary>
      </BrowserRouter>
    </NetworkStatusProvider>
  );
}
