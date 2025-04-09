import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FiHome, 
  FiBook, 
  FiFolder, 
  FiSettings, 
  FiLogOut,
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';
import userDefaultPic from '../../assets/user.png';
import './Sidebar.scss';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState({
    fullName: '',
    profilePic: userDefaultPic,
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('You have been signed out successfully!');
      navigate('/');
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              fullName: data.fullName || currentUser.displayName || currentUser.email,
              profilePic: data.profilePic || currentUser.photoURL || userDefaultPic,
              email: currentUser.email
            });
          } else {
            setUserData({
              fullName: currentUser.displayName || currentUser.email,
              profilePic: currentUser.photoURL || userDefaultPic,
              email: currentUser.email
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;
  
    try {
      setLoading(true);
      const storageRef = ref(storage, `profilePics/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
  
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        profilePic: downloadURL,
        fullName: userData.fullName
      });
  
      setUserData(prev => ({
        ...prev,
        profilePic: downloadURL
      }));
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setUserData(prev => ({
        ...prev,
        profilePic: userDefaultPic
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="sidebar-loading">Loading...</div>;

  return (
    <>
      <button className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleSidebar}>
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="user-profile">
          <div className="profile-pic-container">
            <label htmlFor="profile-upload" className="profile-upload-label">
              <img 
                src={userData.profilePic} 
                alt="Profile" 
                className="profile-pic"
              />
              <div className="profile-overlay">
                <FiUser size={16} />
              </div>
            </label>
            <input 
              type="file" 
              id="profile-upload" 
              accept="image/*" 
              onChange={handleProfilePicChange}
              style={{ display: 'none' }}
            />
          </div>
          <p className="username">{userData.fullName}</p>
          <p className="user-email">{userData.email}</p>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigate('/dashboard')}
              >
                <span className="icon"><FiHome size={18} /></span>
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigate('/semester')}
              >
                <span className="icon"><FiBook size={18} /></span>
                <span>Semester</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigate('/studycards')}
              >
                <span className="icon"><FiFolder size={18} /></span>
                <span>StudyCards</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigate('/account')}
              >
                <span className="icon"><FiSettings size={18} /></span>
                <span>Account Settings</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={handleSignOut}
              >
                <span className="icon"><FiLogOut size={18} /></span>
                <span>Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;