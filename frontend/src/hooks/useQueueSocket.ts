import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useState } from 'react';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? 'http://localhost:8080/ws';

export function useQueueSocket(topics: string[], onMessage: () => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        topics.forEach(topic => client.subscribe(topic, onMessage));
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false)
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [topics.join('|'), onMessage]);

  return connected;
}
