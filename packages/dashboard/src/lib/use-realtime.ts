'use client';

import { useEffect } from 'react';
import { mutate } from 'swr';

export function useRealtime() {
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'heartbeat') return;

        // Revalidate the relevant SWR cache based on category
        switch (data.category) {
          case 'settings':
            mutate('settings');
            mutate('stats');
            break;
          case 'plugins':
            mutate('plugins');
            mutate('stats');
            mutate('skills');
            break;
          case 'mcps':
            mutate('mcp-servers');
            mutate('stats');
            break;
          case 'sessions':
            mutate('sessions');
            break;
          case 'profiles':
            mutate('profiles');
            mutate('stats');
            break;
          default:
            // Revalidate everything
            mutate(() => true);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => eventSource.close();
  }, []);
}
