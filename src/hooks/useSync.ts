import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAllData, loadAllData, getUser, saveUser, clearAllData } from '../data/store';

export function useSync(userId: string | undefined) {
  const syncTimeout = useRef<number | null>(null);
  const applyingRemoteRef = useRef(false);
  const localChangedDuringInitialRef = useRef(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setInitialLoading(false);
      return;
    }
    let mounted = true;
    applyingRemoteRef.current = false;
    localChangedDuringInitialRef.current = false;
    setInitialLoading(true);

    // If a different user logged in, clear stale data from the previous user.
    const localUser = getUser();
    if (localUser.id !== 'local-user' && localUser.id !== userId) {
      clearAllData(true);
    }

    async function initialDownload() {
      const { data, error } = await supabase
        .from('user_data')
        .select('payload')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Cloud Sync: Error downloading data", error);
      }

      let dataLoaded = false;

      if (!error && data && data.payload && mounted) {
        // If user changed local data while we were downloading,
        // avoid clobbering their changes with stale remote payload.
        if (!localChangedDuringInitialRef.current) {
          applyingRemoteRef.current = true;
          loadAllData(data.payload);
          applyingRemoteRef.current = false;
          dataLoaded = true;
        }
      }

      // If no cloud data was loaded (error, empty, or no row),
      // ensure local user has the correct auth id so the app
      // doesn't get stuck on the loading screen.
      if (!dataLoaded && mounted) {
        const localUser = getUser();
        if (localUser.id !== userId) {
          applyingRemoteRef.current = true;
          saveUser({ ...localUser, id: userId! });
          applyingRemoteRef.current = false;
        }
      }

      if (mounted) setInitialLoading(false);
    }

    const handleLocalChange = () => {
      if (applyingRemoteRef.current) return;
      localChangedDuringInitialRef.current = true;

      if (syncTimeout.current) window.clearTimeout(syncTimeout.current);

      syncTimeout.current = window.setTimeout(async () => {
        const payload = getAllData();
        const { error } = await supabase
          .from('user_data')
          .upsert({ user_id: userId, payload, updated_at: new Date().toISOString() });
          
        if (error) {
          console.error("Cloud Sync: Error uploading data", error);
        } else {
          console.log("Cloud Sync: Data uploaded successfully.");
        }
      }, 1500);
    };

    initialDownload();
    window.addEventListener('gymplus_store_changed', handleLocalChange);

    return () => {
      mounted = false;
      window.removeEventListener('gymplus_store_changed', handleLocalChange);
      if (syncTimeout.current) window.clearTimeout(syncTimeout.current);
    };
  }, [userId]);

  return { initialLoading };
}
