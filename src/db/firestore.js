import { db } from '../firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  query,
  onSnapshot,
  collection,
  where,
  updateDoc,
  arrayUnion,
} from '@react-native-firebase/firestore';

class Firestore {
  async saveUser(uid, data) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          status: 'online',
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          ...data,
        },
        { merge: true },
      );
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
      throw err;
    }
  }

  async updateUser(uid, data) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          ...data,
          lastSeen: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
      throw err;
    }
  }

  subscribeToUsers(callback) {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, querySnapshot => {
      const users = [];
      querySnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    });
  }

  async createCall(callId, data) {
    await setDoc(doc(db, 'calls', callId), {
      ...data,
      createdAt: serverTimestamp(),
      status: 'initiated',
      offerCandidates: [],
      answerCandidates: [],
    });
  }

  async updateCall(callId, data) {
    await updateDoc(doc(db, 'calls', callId), { ...data });
  }

  listenToCall(callId, cb) {
    return onSnapshot(doc(db, 'calls', callId), snap => {
      cb(snap.exists() ? snap.data() : null);
    });
  }

  listenIncomingCalls(userId, callback) {
    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('calleeId', '==', userId),
      where('status', '==', 'initiated'),
    );

    this._incomingCallUnsubscribe = onSnapshot(q, snapshot => {
      const calls = [];
      snapshot.forEach(doc => {
        calls.push({ id: doc.id, ...doc.data() });
      });
      callback(calls);
    });

    return this._incomingCallUnsubscribe;
  }
  
  clearIncomingCallListener(userId) {
    if (this._incomingCallUnsubscribe) {
      this._incomingCallUnsubscribe();
      this._incomingCallUnsubscribe = null;
    }
  }
  arrayUnion(element) {
    return arrayUnion(element);
  }
}

export const firestore = new Firestore();
