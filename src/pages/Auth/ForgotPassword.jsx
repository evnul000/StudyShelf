import { useState } from 'react';
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from '../../firebase';
import { Link } from 'react-router-dom';
import './Auth.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setStep(2);
      setSuccess('Verification code sent to your email');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      await verifyPasswordResetCode(auth, code);
      setStep(3);
      setError('');
    } catch (error) {
      setError('Invalid or expired verification code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await confirmPasswordReset(auth, code, newPassword);
      setSuccess('Password changed successfully! Redirecting to login...');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="password-reset-card">
        <h2>Password Recovery</h2>
        
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">
              Send Verification Code
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="input-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
              <small>Check your email for the verification code</small>
            </div>
            <button type="submit" className="auth-button">
              Verify Code
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">
              Reset Password
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">Remember your password? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;