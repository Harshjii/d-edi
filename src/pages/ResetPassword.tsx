import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Extract oobCode from query params
    const params = new URLSearchParams(location.search);
    const code = params.get('oobCode');
    if (!code) {
      setError('Invalid or expired password reset link.');
      setVerifying(false);
      return;
    }
    setOobCode(code);

    // Verify the code is valid
    const auth = getAuth();
    verifyPasswordResetCode(auth, code)
      .then(() => setVerifying(false))
      .catch(() => {
        setError('This password reset link is invalid or has expired.');
        setVerifying(false);
      });
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!oobCode) {
      setError('Invalid or expired password reset link.');
      return;
    }

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess('Password reset successful! You can now log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError('Failed to reset password. The link may have expired or is invalid.');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-text-secondary">Verifying reset link...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg shadow text-center">
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-accent text-white rounded-lg"
            onClick={() => navigate('/forgot-password')}
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-8 animate-fadeInUp">
        <h2 className="text-3xl font-bold text-text-primary mb-6">Set New Password</h2>
        {success && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-center">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter new password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Confirm new password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent-dark text-white py-3 rounded-lg font-semibold transition-all duration-200"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;