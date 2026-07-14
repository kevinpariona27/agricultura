import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { isOnline, processQueue, getQueueLength } from "../utils/offlineQueue";

export function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [queueSize, setQueueSize] = useState(getQueueLength());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setSyncing(true);
      processQueue().then((processed) => {
        if (processed > 0) {
          setQueueSize(getQueueLength());
        }
        setSyncing(false);
      });
    }
    function handleOffline() {
      setOnline(false);
    }
    function handleQueueChange() {
      setQueueSize(getQueueLength());
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-queue-changed", handleQueueChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-queue-changed", handleQueueChange);
    };
  }, []);

  if (online && queueSize === 0 && !syncing) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        online
          ? "bg-amber-600"
          : "bg-destructive"
      }`}
      data-testid="offline-banner"
    >
      {online ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>
            {syncing
              ? "Sincronizando cambios pendientes..."
              : `${queueSize} cambio(s) pendiente(s) por sincronizar`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Sin conexión — cambios guardados localmente</span>
        </>
      )}
    </div>
  );
}
