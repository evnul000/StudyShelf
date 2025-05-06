import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { auth, googleProvider, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import './Auth.scss';
import AnimatedBackground from '../../components/AnimatedBackground/AnimatedBackground';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required('Required'),
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setFirebaseError('');
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
          fullName: values.fullName,
          email: values.email,
          createdAt: new Date(),
        });

        navigate('/dashboard');
      } catch (error) {
        setFirebaseError(getFirebaseErrorMessage(error.code));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName || '',
        email: user.email,
        createdAt: new Date(),
      });
      
      navigate('/dashboard');
    } catch (error) {
      setFirebaseError('Failed to sign up with Google');
    }
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      default:
        return 'Registration failed. Please try again';
    }
  };

  return (
    <div className="auth-container">
      <AnimatedBackground/>
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="subtitle">Please enter your details</p>

        <form className="auth-form" onSubmit={formik.handleSubmit}>
          {firebaseError && <div className="error-message">{firebaseError}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              {...formik.getFieldProps('fullName')}
              className={formik.touched.fullName && formik.errors.fullName ? 'error' : ''}
            />
            {formik.touched.fullName && formik.errors.fullName && (
              <div className="error-text">{formik.errors.fullName}</div>
            )}
          </div>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...formik.getFieldProps('confirmPassword')}
              className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <div className="error-text">{formik.errors.confirmPassword}</div>
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
          </div>

          <button 
            type="submit" 
            className="primary-button"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="google-button"
            onClick={handleGoogleSignUp}
          >
            <FcGoogle size={20} />
            Sign up with Google
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;