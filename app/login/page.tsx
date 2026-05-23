import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | Clubhouse",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">Clubhouse</h1>
          <p className="text-stone-500 text-sm">Admin Portal</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
          <h2 className="font-serif text-xl font-semibold text-stone-900 mb-6">Sign In</h2>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Restricted area. Authorised personnel only.
        </p>
      </div>
    </div>
  );
}
