import React, { useEffect } from "react";

interface useTextSocketProps {
    setTranscription: React.Dispatch<React.SetStateAction<string>>;
    setVisemesQueue: React.Dispatch<React.SetStateAction<Array<{ [key: string]: number | string }>>>;
    isConnected: boolean;
    host: string;
    port: number;
}

const useTextSocket = ({ setTranscription, setVisemesQueue, isConnected, host, port }: useTextSocketProps) => {
    useEffect(() => {
        if (!isConnected) return;

        // const ws = new WebSocket(`ws://${host}:${port}`);
        const ws = new WebSocket(`ws://localhost:5002`);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            console.log("TextSocket connection opened");
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "text") {
                setTranscription(message.data);
            } else if (message.type === "visemes") {
                setVisemesQueue(prevQueue => [...prevQueue, message.data]);
            }
        };

        ws.onerror = (error) => {
            console.error("TextSocket error:", error);
        };

        ws.onclose = (event) => {
            console.log("TextSocket connection closed:", event.code, event.reason);
        };

        return () => {
            ws.close();
            console.log("TextSocket connection closed on component unmount");
        };
    }, [isConnected]);
};

export default useTextSocket;
