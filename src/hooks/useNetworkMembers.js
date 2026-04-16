import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook que suscribe en tiempo real a los miembros del Círculo Íntimo.
 * Retorna el array de miembros activos (status !== 'candidate').
 */
const useNetworkMembers = (user) => {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'network'),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(all.filter(p => p.status !== 'candidate'));
      },
      (err) => console.warn('useNetworkMembers error:', err)
    );
    return () => unsub();
  }, [user]);

  return members;
};

export default useNetworkMembers;
