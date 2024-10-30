import React from "react";

export interface WebSocketReceiverProps {
    setText: React.Dispatch<React.SetStateAction<string>>;
    setVisemesQueue: React.Dispatch<React.SetStateAction<string[]>>;
    audioQueue: React.MutableRefObject<Float32Array[]>;
    isConnected: boolean;
    setHasAudio: React.Dispatch<React.SetStateAction<boolean>>;
    host: string;
    port: number;
}

interface Message {
    type: 'text' | 'visemes' | 'audio';
    data: any;
}

const setupWebSocket = ({ setText, setVisemesQueue, audioQueue, isConnected, setHasAudio, host, port }: WebSocketReceiverProps) => {
    if (!isConnected) return;

    const ws = new WebSocket(`ws://${host}:${port}`);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
        console.log("WebSocket connection opened");
    };

    ws.onmessage = (event) => {
        const data: Message = JSON.parse(event.data);

        switch (data.type) {
            case 'text':
                console.log(data.data)
                setText(data.data);
                break;
            case 'visemes':
                setVisemesQueue(prevQueue => [...prevQueue, data.data]);
                break;
            case 'audio':
                const audioChunk = event.data;
                const int16Array = new Int16Array(audioChunk);
                const float32Array = convertInt16ToFloat32(int16Array);

                audioQueue.current.push(float32Array);
                setHasAudio(true);
                console.log("Received audio chunk");
                break;
        }

        // if (data.text) {
        //     setText(data.text);
        // }
        // if (data.visemes) {
        //     setVisemesQueue(prevQueue => [...prevQueue, data.visemes]);
        // }
        // if (data.audio) {
        //     const audioChunk = event.data;
        //     const int16Array = new Int16Array(audioChunk);
        //     const float32Array = convertInt16ToFloat32(int16Array);

        //     audioQueue.current.push(float32Array);
        //     setHasAudio(true);
        //     console.log("Received audio chunk");
        // }
        
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
    };

    return ws;
};

// Helper function to convert Int16Array to Float32Array
const convertInt16ToFloat32 = (int16Array: Int16Array): Float32Array => {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
    }
    return float32Array;
};

export default setupWebSocket;
