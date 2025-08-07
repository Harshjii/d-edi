import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getAuth, confirmPasswordReset, fetchSignInMethodsForEmail } from 'firebase/auth';
import { Mail, Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [checkingGoogle, setCheckingGoogle] = useState(false);

  // Extract oobCode and email from query params
  const params = new URLSearchParams(location.search);
  const oobCode = params.get('oobCode');
  const mode = params.get('mode');

  // Try to fetch email from oobCode (Firebase does not expose this directly, so user must enter email)
  // We'll ask for email if not present, and check if it's a Google account
  useEffect(() => {
    // Only check if mode is resetPassword and oobCode is present
    if (mode === 'resetPassword' && oobCode) {
      // No-op: Firebase does not provide a way to get email from oobCode in client SDK
      // We'll ask user for email if needed
    }
  }, [mode, oobCode]);

  // Check if the email is a Google account before allowing reset
  const checkGoogleAccount = async (emailToCheck: string) => {
    setCheckingGoogle(true);
    try {
      const auth = getAuth();
      const methods = await fetchSignInMethodsForEmail(auth, emailToCheck);
      if (methods.includes('google.com')) {
        setStatus({
          type: 'error',
          message: 'This account uses Google sign-in. Please login using Google instead of resetting your password here.'
        });
        return true;
      }
      return false;
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to check account type.'
      });
      return true;
    } finally {
      setCheckingGoogle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });

    if (!oobCode) {
      setStatus({ type: 'error', message: 'Invalid or missing reset code.' });
      return;
    }
    if (!email) {
      setStatus({ type: 'error', message: 'Please enter your email.' });
      return;
    }
    if (!password || password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    // Check if this is a Google account
    const isGoogle = await checkGoogleAccount(email);
    if (isGoogle) return;

    setLoading(true);
    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, password);
      setStatus({ type: 'success', message: 'Password has been reset. You can now log in.' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-red-600 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-600 mt-2">Enter your email and new password below.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {status.type && (
            <div className={`${
              status.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-red-50 border-red-200 text-red-600'
            } px-4 py-3 rounded-lg border flex items-center`}>
              {status.type === 'success' ? (
                <Check className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {status.message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={loading || checkingGoogle}
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter new password"
                required
                minLength={6}
                disabled={loading || checkingGoogle}
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Confirm new password"
                required
                minLength={6}
                disabled={loading || checkingGoogle}
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || checkingGoogle}
            className={`w-full bg-gradient-to-r from-yellow-500 to-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
              loading || checkingGoogle ? 'opacity-70 cursor-not-allowed' : 'hover:from-yellow-600 hover:to-red-700'
            }`}
          >
            {loading || checkingGoogle ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center text-yellow-600 hover:text-yellow-500 font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
