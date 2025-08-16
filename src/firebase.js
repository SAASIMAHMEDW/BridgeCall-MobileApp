import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

// Export the initialized services
export const app = getApp();
export const firestore = getFirestore(app);
export const auth = getAuth(app);