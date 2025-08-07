import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setStatus({
        type: 'success',
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
      setEmail('');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setStatus({ type: 'error', message: 'No account found with this email address.' });
      } else if (error.code === 'auth/invalid-email') {
        setStatus({ type: 'error', message: 'Invalid email format.' });
      } else {
        setStatus({ type: 'error', message: 'An error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-8 animate-fadeInUp">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-accent font-bold text-2xl">D</span>
          </div>
          <h2 className="text-3xl font-bold text-text-primary">Reset Password</h2>
          <p className="text-text-secondary mt-2">
            Enter your email and we'll send a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {status.type && (
            <div
              className={`${
                status.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-red-50 border-red-200 text-red-600'
              } px-4 py-3 rounded-lg border flex items-center`}
            >
              {status.type === 'success' ? <Check className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
              {status.message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter your email"
                required
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-accent hover:bg-accent-dark text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center text-accent hover:underline font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;