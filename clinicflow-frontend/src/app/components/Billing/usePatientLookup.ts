import { useState, useEffect } from 'react';
import axiosInstance from '../../services/client';

interface PatientLookupResult {
  name: string;       // resolved name — empty string until found
  loading: boolean;
  error: string;      // e.g. "Patient not found" — empty string when ok
}

/**
 * Resolves a patient name from a numeric Patient ID string.
 *
 * - Debounces 400 ms so we don't fire on every keystroke
 * - Clears state immediately when the field is emptied
 * - Returns { name, loading, error }
 */
export function usePatientLookup(patientId: string): PatientLookupResult {
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    // Nothing to look up — reset and bail
    const numId = Number(patientId);
    if (!patientId || isNaN(numId) || numId <= 0) {
      setName('');
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setName('');
    setError('');

    // Debounce: wait 400 ms after the user stops typing
    const timer = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get(`/consultation/patient/${numId}`);
        setName(data.name || 'Unknown Patient');
      } catch {
        setError('Patient not found');
      } finally {
        setLoading(false);
      }
    }, 400);

    // Cleanup: cancel the timer if patientId changes before 400 ms
    return () => clearTimeout(timer);
  }, [patientId]);

  return { name, loading, error };
}
