import React, { useEffect } from "react";

interface useAudioSocketProps {
    // setAudioQueue: React.Dispatch<React.SetStateAction<Int16Array[]>>;
    setAudioQueue: React.Dispatch<React.SetStateAction<Float32Array[]>>;
    isConnected: boolean;
    host: string;
    port: number;
}

const useAudioSocket = ({ setAudioQueue, isConnected, host, port }: useAudioSocketProps) => {
    useEffect(() => {
        if (!isConnected) return;

        const ws = new WebSocket(`ws://${host}:${port}`);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            console.log("AudioSocket connection opened");
        };

        ws.onmessage = (event) => {
            const audioChunk = new Float32Array(event.data);
            setAudioQueue(prevQueue => [...prevQueue, audioChunk]);
            console.log("received bytes")
        };

        ws.onerror = (error) => {
            console.error("AudioSocket error:", error);
        };

        ws.onclose = (event) => {
            console.log("AudioSocket connection closed:", event.code, event.reason);
        };

        return () => {
            ws.close();
            console.log("AudioSocket connection closed on component unmount");
        };
    }, [isConnected]);
};

export default useAudioSocket;
