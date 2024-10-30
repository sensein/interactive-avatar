import React, { useEffect, useState } from 'react';

const AudioReceiver: React.FC = () => {
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        setIsConnected(true);
    };
    
    useEffect(() => {
        if (!isConnected) return;

        const ws = new WebSocket("ws://localhost:8000");
        ws.binaryType = "arraybuffer";  // Expect binary data

        ws.onopen = () => {
            console.log("WebSocket connection opened");
        };

        ws.onmessage = (event) => {
            const audioChunk = event.data;
            console.log("Received chunk of size:", audioChunk.byteLength);

            // Convert the chunk into a Blob and store it
            const chunkBlob = new Blob([audioChunk], { type: 'audio/wav' });
            setAudioChunks((prevChunks) => [...prevChunks, chunkBlob]);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);  // Log the exact WebSocket error
        };

        ws.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
        };

        return () => {
            ws.close();
        };
    }, [isConnected]);

    const playAudio = () => {
        const combinedBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(combinedBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    };

    return (
        <div>
            <h1>Audio Receiver</h1>
            <button onClick={handleConnect} disabled={isConnected}>
                Connect to WebSocket
            </button>
            <button onClick={playAudio}>Play Received Audio</button>
        </div>
    );
};

export default AudioReceiver;
