import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { auth, googleProvider } from '../../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import './Auth.scss';

const LoginPage = () => {
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setFirebaseError('');
        await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        navigate('/dashboard');
      } catch (error) {
        setFirebaseError(getFirebaseErrorMessage(error.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (error) {
      setFirebaseError('Failed to sign in with Google');
    }
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':
        return 'Email not registered';
      case 'auth/wrong-password':
        return 'Incorrect password';
      default:
        return 'Login failed. Please try again';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="subtitle">Please enter your details</p>

        <form className="auth-form" onSubmit={formik.handleSubmit}>
          {firebaseError && <div className="error-message">{firebaseError}</div>}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              {...formik.getFieldProps('email')}
              className={formik.touched.email && formik.errors.email ? 'error' : ''}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error-text">{formik.errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              {...formik.getFieldProps('password')}
              className={formik.touched.password && formik.errors.password ? 'error' : ''}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="error-text">{formik.errors.password}</div>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={() => setRememberMe(!rememberMe)} 
              />
              <span className="checkmark"></span>
              Remember for 30 days
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="primary-button"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="google-button"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle size={20} />
            Sign in with Google
          </button>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;