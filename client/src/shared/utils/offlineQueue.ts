const STORAGE_KEY = "offline-queue";

export interface QueuedAction {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  url: string;
  body?: unknown;
  timestamp: number;
}

function getQueue(): QueuedAction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueue(action: Omit<QueuedAction, "id" | "timestamp">): void {
  const queue = getQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  saveQueue(queue);
  window.dispatchEvent(new CustomEvent("offline-queue-changed"));
}

export function getQueueLength(): number {
  return getQueue().length;
}

const BASE_URL = "/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function processQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedAction[] = [];
  let processed = 0;

  for (const action of queue) {
    try {
      const res = await fetch(`${BASE_URL}${action.url}`, {
        method: action.method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (!res.ok) {
        remaining.push(action);
      } else {
        processed++;
      }
    } catch {
      remaining.push(action);
    }
  }

  saveQueue(remaining);
  if (processed > 0) {
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
  }
  return processed;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function clearQueue(): void {
  saveQueue([]);
  window.dispatchEvent(new CustomEvent("offline-queue-changed"));
}
