import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/client.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

/**
 * Establish a singleton-ish socket connection for the lifetime of the
 * component and subscribe to a map of events. Reconnects with the current
 * access token when available.
 *
 *   useSocket({ 'order:status': (o) => setOrder(o) }, { track: orderNumber });
 */
export default function useSocket(handlers = {}, { track } = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    if (track) socket.emit('order:track', track);

    // Bind all handlers through a stable ref so consumers can pass inline fns
    const names = Object.keys(handlersRef.current);
    names.forEach((event) => {
      socket.on(event, (payload) => handlersRef.current[event]?.(payload));
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  return socketRef;
}
