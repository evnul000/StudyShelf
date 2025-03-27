import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase';

const ForgotPassword = () => {
  const handleReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleReset(e.target.email.value);
    }}>
      <input name="email" type="email" required />
      <button>Send Reset Email</button>
    </form>
  );
};