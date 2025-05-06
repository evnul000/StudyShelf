import { useState, useRef, useEffect } from 'react';
import { updateProfile, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged } from 'firebase/auth';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiCamera, FiCheck, FiX, FiArrowLeft } from 'react-icons/fi';
import Navbar from '../../components/NavBar';
import Sidebar from '../../components/Sidebar/Sidebar';
import './AccountPage.scss';

const AccountPage = () => {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePic, setProfilePic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState({ 
    fullName: '', 
    email: '',
    profilePic: '' // Added profilePic to userData state
  });

  // Animation state
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              fullName: data.fullName || '',
              email: currentUser.email || '',
              profilePic: data.profilePic || currentUser.photoURL || ''
            });
            
            // Set profile picture from Firestore if available, otherwise use auth photoURL
            setProfilePic(data.profilePic || currentUser.photoURL || '');
          } else {
            // If no document exists, use auth photoURL
            setProfilePic(currentUser.photoURL || '');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to auth photoURL if Firestore fails
          setProfilePic(currentUser.photoURL || '');
        }
        
        setAnimate(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) {
      setErrorMessage('No file selected or user not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePics/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Auth profile
      await updateProfile(user, { photoURL: downloadURL });
      
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profilePic: downloadURL,
        fullName: userData.fullName,
        email: user.email
      });

      // Update local state
      setProfilePic(downloadURL);
      setUserData(prev => ({ ...prev, profilePic: downloadURL }));
      setSuccessMessage('Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setErrorMessage(`Failed to update profile picture: ${error.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
    }
  };


  const handleProfileUpdate = async (values) => {
    try {
      setIsLoading(true);
      
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: values.name
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        fullName: values.name
      }));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsEditing(false);
    } catch (error) {
      setErrorMessage('Failed to update profile.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, values.newEmail);
      
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        email: values.newEmail
      });

      setSuccessMessage('Email updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, values.newPassword);
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      resetForm();
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const profileValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required').max(50, 'Name too long'),
  });

  const emailValidationSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newEmail: Yup.string().email('Invalid email').required('New email is required'),
  });

  const passwordValidationSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .required('New password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Must contain uppercase, lowercase, number and special character'
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Please confirm your password'),
  });

  return (
    <div>
   
    <div className={`account-page ${animate ? 'animate-in' : ''}`}>
         <Navbar/>
         <Sidebar/>
      <button className="back-button" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      <div className="account-container">
        <div className="account-header">
          <div className="profile-pic-container">
            <div className="profile-pic-wrapper">
              <img 
                src={profilePic || 'https://placehold.co/800@2x.png'} 
                alt="Profile" 
                className="profile-pic"
              />
              <button 
                className="change-photo-btn"
                onClick={() => fileInputRef.current.click()}
                aria-label="Change profile picture"
              >
                <FiCamera />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </button>
            </div>
            {isLoading && <div className="loading-spinner"></div>}
          </div>
          <h1>{userData.fullName || 'User'}</h1>
          <p>{userData.email}</p>
        </div>

        {successMessage && (
          <div className="alert success">
            <FiCheck /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert error">
            <FiX /> {errorMessage}
          </div>
        )}

        <div className="account-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser /> Profile
          </button>
          <button
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <FiMail /> Email
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <FiLock /> Password
          </button>
        </div>

        <div className="account-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              {!isEditing ? (
                <div className="profile-info">
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{userData.fullName || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{userData.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Account Created:</span>
                    <span className="value">
                      {new Date(user?.metadata.creationTime).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                </div>
              ) : (
                <Formik
                  initialValues={{ name: userData.fullName || '' }}
                  validationSchema={profileValidationSchema}
                  onSubmit={handleProfileUpdate}
                >
                  {({ isSubmitting }) => (
                    <Form className="edit-form">
                      <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <Field type="text" id="name" name="name" />
                        <ErrorMessage name="name" component="div" className="error-message" />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="cancel-btn"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="save-btn"
                          disabled={isSubmitting || isLoading}
                        >
                          {isSubmitting || isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="email-section">
              <Formik
                initialValues={{ currentPassword: '', newEmail: '' }}
                validationSchema={emailValidationSchema}
                onSubmit={handleEmailUpdate}
              >
                {({ isSubmitting }) => (
                  <Form className="security-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        <FiLock /> Current Password
                      </label>
                      <Field
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        autoComplete="current-password"
                      />
                      <ErrorMessage
                        name="currentPassword"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newEmail">
                        <FiMail /> New Email
                      </label>
                      <Field
                        type="email"
                        id="newEmail"
                        name="newEmail"
                        autoComplete="email"
                      />
                      <ErrorMessage
                        name="newEmail"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <button
                      type="submit"
                      className="update-btn"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading ? 'Updating...' : 'Update Email'}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="password-section">
              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                }}
                validationSchema={passwordValidationSchema}
                onSubmit={handlePasswordUpdate}
              >
                {({ isSubmitting }) => (
                  <Form className="security-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        <FiLock /> Current Password
                      </label>
                      <Field
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        autoComplete="current-password"
                      />
                      <ErrorMessage
                        name="currentPassword"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">
                        <FiLock /> New Password
                      </label>
                      <Field
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        autoComplete="new-password"
                      />
                      <ErrorMessage
                        name="newPassword"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        <FiLock /> Confirm Password
                      </label>
                      <Field
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        autoComplete="new-password"
                      />
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="error-message"
                      />
                    </div>
                    <button
                      type="submit"
                      className="update-btn"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AccountPage;