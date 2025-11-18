import { useEffect } from "react";
import echo from "@/utils/echo";

export function useEchoChannel(channelName: string, eventName: string, callback: (data: any) => void) {
    useEffect(() => {
        if (!echo) return;

        const channel = echo.channel(channelName);
        channel.listen(eventName, callback);

        return () => {
            channel.stopListening(eventName);
        };
    }, [channelName, eventName, callback]);
}
