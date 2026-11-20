import { getSupabase } from "@/lib/supabase";

/**
 * Realtime events over the backend's own WebSocket (/ws/realtime), the one the app uses in place of Pusher:
 * chat messages, the chat clock, ticks, the waiting line and presence. Frames keep Pusher's shape
 * ({channel, event, data-as-string}). The server joins the user's own channel (astroshrine-global<id>) on
 * connect; anything else is asked for with {type: 'sub', channel}.
 *
 * The browser cannot set an Authorization header on a WebSocket, so the access token goes in `?token=`,
 * which the backend still accepts for this. The socket connects only while someone listens and a user is
 * signed in, reconnects with backoff, and re-subscribes after every reconnect.
 */

export type RealtimeHandler = (event: string, data: unknown) => void;

const PING_MS = 25_000;
/** No frame (pong included) for this long: a half-open socket. */
const DEAD_MS = 70_000;
const MAX_BACKOFF_MS = 30_000;
/** Keep the socket a little after the last listener leaves, so page changes do not reconnect. */
const IDLE_CLOSE_MS = 30_000;

let ws: WebSocket | null = null;
let open = false;
let connecting = false;
let blocked = false;
let backoff = 1000;
let lastFrameAt = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;
let pingTimer: ReturnType<typeof setInterval> | undefined;

const handlers = new Map<string, Set<RealtimeHandler>>();
const statusListeners = new Set<() => void>();

/** wss://… of the backend, from NEXT_PUBLIC_BACKEND_WS_URL. Without it the website works, minus live updates. */
function socketBase(): string | null {
  const base = process.env.NEXT_PUBLIC_BACKEND_WS_URL?.trim().replace(/\/+$/, "");
  return base ? base.replace(/^http/, "ws") : null;
}

export const realtimeConfigured = () => !!socketBase();

function setOpen(next: boolean) {
  if (open === next) return;
  open = next;
  statusListeners.forEach((fn) => fn());
}

function send(msg: object) {
  if (open && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

/** The user's own channel is joined by the server on connect; asking for it again is harmless but skipped. */
const isServerJoined = (channel: string) => channel === "astroshrine" || channel === ownChannel;
let ownChannel = "";

function scheduleRetry() {
  clearTimeout(retryTimer);
  if (!handlers.size || blocked) return;
  retryTimer = setTimeout(() => {
    retryTimer = undefined;
    void connect();
  }, backoff);
  backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
}

function drop(sock: WebSocket) {
  if (ws !== sock) return;
  ws = null;
  clearInterval(pingTimer);
  try {
    sock.close();
  } catch {
    /* already closed */
  }
  setOpen(false);
  scheduleRetry();
}

async function connect() {
  if (ws || connecting || !handlers.size || blocked || typeof window === "undefined") return;
  const base = socketBase();
  if (!base) return;
  connecting = true;
  let token: string | null = null;
  let userId = "";
  try {
    const { data } = await getSupabase().auth.getSession();
    token = data.session?.access_token ?? null;
    userId = data.session?.user.id ?? "";
  } catch {
    /* treated as signed out */
  }
  connecting = false;
  if (ws || !handlers.size) return;
  if (!token) return scheduleRetry();
  ownChannel = userId ? `astroshrine-global${userId}` : "";

  const sock = new WebSocket(`${base}/ws/realtime?token=${encodeURIComponent(token)}`);
  ws = sock;
  lastFrameAt = Date.now();
  // From connect, not open, so a socket stuck connecting is recycled too.
  pingTimer = setInterval(() => {
    if (Date.now() - lastFrameAt > DEAD_MS) return drop(sock);
    send({ type: "ping" });
  }, PING_MS);

  sock.onopen = () => {
    if (ws !== sock) return;
    backoff = 1000;
    lastFrameAt = Date.now();
    setOpen(true);
    for (const channel of handlers.keys()) if (!isServerJoined(channel)) send({ type: "sub", channel });
  };
  sock.onmessage = (e) => {
    if (ws !== sock) return;
    lastFrameAt = Date.now();
    let msg: { channel?: string; event?: string; data?: unknown; type?: string };
    try {
      msg = JSON.parse(String(e.data));
    } catch {
      return;
    }
    if (!msg?.channel || !msg.event) return;
    let data: unknown = msg.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        /* plain string payload */
      }
    }
    for (const fn of handlers.get(msg.channel) ?? []) {
      try {
        fn(msg.event, data);
      } catch (error) {
        console.error("[realtime] handler failed:", error);
      }
    }
  };
  sock.onerror = () => {
    /* onclose follows */
  };
  sock.onclose = (e) => {
    // 4403: the account was suspended; the next API call signs the user out with the reason.
    if (ws === sock && e.code === 4403) blocked = true;
    drop(sock);
  };
}

function closeIfIdle() {
  clearTimeout(idleTimer);
  if (handlers.size) return;
  idleTimer = setTimeout(() => {
    if (handlers.size || !ws) return;
    const sock = ws;
    ws = null;
    clearInterval(pingTimer);
    clearTimeout(retryTimer);
    try {
      sock.close();
    } catch {
      /* already closed */
    }
    setOpen(false);
  }, IDLE_CLOSE_MS);
}

/**
 * Listen to one channel (e.g. `astroshrine-session<chatId>` or `astroshrine-global<userId>`).
 * Returns the unsubscribe function.
 */
export function subscribe(channel: string, handler: RealtimeHandler): () => void {
  let set = handlers.get(channel);
  const isNew = !set;
  if (!set) {
    set = new Set();
    handlers.set(channel, set);
  }
  set.add(handler);
  clearTimeout(idleTimer);
  if (isNew && !isServerJoined(channel)) send({ type: "sub", channel });
  void connect();
  return () => {
    const current = handlers.get(channel);
    if (!current) return;
    current.delete(handler);
    if (current.size) return;
    handlers.delete(channel);
    if (!isServerJoined(channel)) send({ type: "unsub", channel });
    closeIfIdle();
  };
}

/** Sign-out or a new account: drop the socket authorised for the old one; listeners stay and reconnect. */
export function resetRealtime() {
  blocked = false;
  backoff = 1000;
  if (ws) drop(ws);
  else void connect();
}

export function subscribeStatus(fn: () => void): () => void {
  statusListeners.add(fn);
  return () => {
    statusListeners.delete(fn);
  };
}

export const isRealtimeOpen = () => open;

export const sessionChannel = (chatId: string) => `astroshrine-session${chatId}`;
export const globalChannel = (userId: string) => `astroshrine-global${userId}`;
