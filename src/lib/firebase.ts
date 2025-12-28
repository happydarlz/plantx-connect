import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCrN1K6Pp6jTBQoS3OyLlcvTJu6sF8r-zM",
  authDomain: "plantx-cfb77.firebaseapp.com",
  projectId: "plantx-cfb77",
  storageBucket: "plantx-cfb77.firebasestorage.app",
  messagingSenderId: "826971417102",
  appId: "1:826971417102:web:f8a6b0d818ccccdcf7aa5f",
  measurementId: "G-ZL5JKTKT8Y"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return { user: null, error: error.message };
  }
};

// Phone Auth - Setup Recaptcha
export const setupRecaptcha = (containerId: string) => {
  try {
    const recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    return recaptchaVerifier;
  } catch (error) {
    console.error("Recaptcha setup error:", error);
    return null;
  }
};

// Send OTP
export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
    return { confirmationResult, error: null };
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return { confirmationResult: null, error: error.message };
  }
};

// Verify OTP
export const verifyOTP = async (confirmationResult: any, otp: string) => {
  try {
    const result = await confirmationResult.confirm(otp);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return { user: null, error: error.message };
  }
};

export default app;
