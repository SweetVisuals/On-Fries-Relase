import React, { useState } from 'react';
import { CustomerLayout } from '../../components/CustomerLayout';
import { User, Mail, Lock, Eye, ShieldCheck, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export const ProfilePage = () => {
  const { user, signIn, signUp, signOut, loading, isAdmin } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSignUpSuccess(false);

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      console.log('Attempting signUp with:', email);
      const { error } = await signUp(email, password);
      console.log('signUp result error:', error);

      if (error) {
        console.error('Full signUp error object:', error);
        setError(error);
      } else {
        setSignUpSuccess(true);
      }
    } else {
      // Handle admin login - convert "admin" to valid email format
      const normalizedEmail = email.trim().toLowerCase();
      const loginEmail = normalizedEmail === 'admin' ? 'admin@admin.local' : normalizedEmail;

      console.log('Attempting signIn with:', loginEmail);
      const { error } = await signIn(loginEmail, password);
      console.log('signIn result error:', error);

      if (error) {
        console.error('Full signIn error object:', error);
        setError(error);
      } else {
        // Redirect based on user role
        setShowAuthModal(false);
        navigate('/');
      }
    }

    setIsLoading(false);
  };

  const switchToSignUp = () => {
    setAuthMode('signup');
    setError('');
    setSignUpSuccess(false);
  };

  const switchToSignIn = () => {
    setAuthMode('signin');
    setError('');
    setSignUpSuccess(false);
    setConfirmPassword('');
  };

  const openAuthModal = () => {
    setShowAuthModal(true);
    setAuthMode('signin');
    setError('');
    setSignUpSuccess(false);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthMode('signin');
    setError('');
    setSignUpSuccess(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="text-white">Loading...</div>
        </div>
      </CustomerLayout>
    );
  }

  if (user) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">
          {/* Profile Card */}
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-brand-yellow/20 text-brand-yellow">
                <User className="w-10 h-10" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome, {user.email}</h2>
              <p className="text-zinc-500">You are signed in</p>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="w-full flex items-center justify-center gap-2 bg-brand-yellow hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors mb-4"
              >
                <ShieldCheck className="w-4 h-4" /> Go to Dashboard
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-fade-in">

        {/* Auth Card */}
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-brand-yellow/20 text-brand-yellow">
              <User className="w-10 h-10" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-zinc-500">
              {authMode === 'signup' ? 'Join us today' : 'Sign in to continue'}
            </p>
          </div>

          {signUpSuccess ? (
            <div className="text-center">
              <div className="text-green-500 mb-4">
                Account created successfully! Please check your email to confirm your account.
              </div>
              <button
                onClick={switchToSignIn}
                className="w-full bg-brand-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all transform active:scale-95 shadow-lg shadow-yellow-900/20"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleAuth}>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type={email === 'admin' ? 'text' : 'email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={email === 'admin' ? 'Enter your username' : 'Enter your email'}
                  className="w-full bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-yellow focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-brand-yellow focus:outline-none transition-all"
                  required
                />
                <button type="button" className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300">
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-zinc-50 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-brand-yellow focus:outline-none transition-all"
                    required
                  />
                  <button type="button" className="absolute right-4 top-3.5 text-zinc-500 hover:text-zinc-300">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              {authMode === 'signin' && (
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                    <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800 text-brand-yellow focus:ring-brand-yellow" />
                    Remember me
                  </label>
                  <button className="text-brand-yellow hover:underline font-medium">Forgot password?</button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-yellow-900/20"
              >
                {isLoading
                  ? (authMode === 'signup' ? 'Creating Account...' : 'Signing In...')
                  : (authMode === 'signup' ? 'Sign Up' : 'Sign In')
                }
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-zinc-500">
            {authMode === 'signup' ? (
              <>Already have an account? <button onClick={switchToSignIn} className="text-brand-yellow font-bold hover:underline">Sign in</button></>
            ) : (
              <>Don't have an account? <button onClick={switchToSignUp} className="text-brand-yellow font-bold hover:underline">Sign up</button></>
            )}
          </div>
        </div>
      </div>

    </CustomerLayout>
  );
};