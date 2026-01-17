import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function Login({ onLogin }) {
  const login = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    onLogin(result.user);
  };

  return (
    <div className="login-screen">
      <h1>AI Therapist</h1>
      <button onClick={login}>Sign in with Google</button>
    </div>
  );
}
