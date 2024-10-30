import React, { useEffect, useState, useRef } from 'react';

interface AudioReceiverProps {
    host: string;
    port: number;
}

const AudioReceiver: React.FC<AudioReceiverProps> = ({ host, port }) => {
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasAudio, setHasAudio] = useState(false); // New state to track if there’s audio
    const audioQueueRef = useRef<Float32Array[]>([]);
    const audioEndTimeRef = useRef<number>(0);

    const handleConnect = () => {
        setIsConnected(true);
        const newAudioContext = new window.AudioContext();
        setAudioContext(newAudioContext);
        audioEndTimeRef.current = newAudioContext.currentTime;
    };

    const setupSocket = () => {
        const ws = new WebSocket(`${host}:${port}`);
        ws.binaryType = "arraybuffer";  // Expect binary data
        
        ws.onopen = () => {
            console.log("WebSocket connection opened");
        };
        
        ws.onmessage = (event) => {
            const audioChunk = event.data;
            const int16Array = new Int16Array(audioChunk);
            const float32Array = convertInt16ToFloat32(int16Array);

            audioQueueRef.current.push(float32Array);

            // Update hasAudio state when audio chunks are received
            if (!hasAudio) {
                setHasAudio(true);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
        };

        return ws;
    };

    useEffect(() => {
        if (!isConnected) return;
        const ws = setupSocket();
        return () => {
            ws.close();
        };
    }, [isConnected]);

    const convertInt16ToFloat32 = (int16Array: Int16Array): Float32Array => {
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768;
        }
        return float32Array;
    };

    const playAudio = () => {
        if (!audioContext || audioQueueRef.current.length === 0) return;

        // Concatenate all received chunks into a single Float32Array
        const allChunks = new Float32Array(audioQueueRef.current.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        audioQueueRef.current.forEach(chunk => {
            allChunks.set(chunk, offset);
            offset += chunk.length;
        });

        const buffer = audioContext.createBuffer(1, allChunks.length, audioContext.sampleRate);
        buffer.copyToChannel(allChunks, 0);

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        const startTime = Math.max(audioEndTimeRef.current, audioContext.currentTime);
        source.start(startTime);

        audioEndTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            audioQueueRef.current = []; // Clear queue after playback
            setHasAudio(false); // Reset hasAudio to disable button
        };
    };

    return (
        <div>
            <h1>Audio Receiver</h1>
            <button onClick={handleConnect} disabled={isConnected}>
                Connect to WebSocket
            </button>
            <button onClick={playAudio} disabled={!hasAudio}>
                Play Received Audio
            </button>
        </div>
    );
};

export default AudioReceiver;
