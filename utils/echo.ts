import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

if (typeof window !== "undefined") {
    // Pusher 需要挂到 window
    window.Pusher = Pusher;
}

const echo =
    typeof window !== "undefined"
        ? new Echo({
              broadcaster: "pusher",
              key: "q3m7v9p5t1h6z4k8d2fj",
              cluster: "",
              wsHost: "ori-ws-dev.being.com", //gate.game.com
              wsPort: 80,
              wssPort: 443,
              forceTLS: true,
              enabledTransports: ["ws", "wss"],
          })
        : null;

export default echo;
