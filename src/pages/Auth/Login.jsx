import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Auth.scss';

const LoginPage = () => {
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = React.useState('');

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
      <form className="auth-form" onSubmit={formik.handleSubmit}>
        <h2>Welcome Back</h2>

        {firebaseError && <div className="error">{firebaseError}</div>}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="error">{formik.errors.email}</div>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error">{formik.errors.password}</div>
          ) : null}
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;