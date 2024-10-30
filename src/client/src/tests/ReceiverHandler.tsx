// App.tsx
import React, { useState } from 'react';
import useTextSocket from './useTextSocket';
import useAudioSocket from './useAudioSocket';
import playAudio from './playAudio';

interface ReceiverHandlerProps {
    setTranscription: React.Dispatch<React.SetStateAction<string>>;
    setVisemesQueue: React.Dispatch<React.SetStateAction<any[]>>;
    // setAudioQueue: React.Dispatch<React.SetStateAction<Int16Array[]>>;
    setAudioQueue: React.Dispatch<React.SetStateAction<Float32Array[]>>;
    // audioQueue: Int16Array[];
    audioQueue: Float32Array[];
    host: string;
    port: number;
}

const ReceiverHandler: React.FC<ReceiverHandlerProps> = ({
    setTranscription,
    setVisemesQueue,
    setAudioQueue,
    audioQueue,
    host,
    port,
}) => {
    const [isConnected, setIsConnected] = useState(false);

    useTextSocket({ setTranscription, setVisemesQueue, isConnected, host, port: 5002 })
    useAudioSocket({ setAudioQueue, isConnected, host, port: 5003 })

    const handleConnect = () => {
        setIsConnected(true);
    }

    const handlePlay = () => {
        playAudio(audioQueue);
        console.log("Play audio")
    }

    return (
        <div>
            <h1>Audio Streaming App</h1>
            <button onClick={handleConnect} disabled={isConnected}>
                Connect to WebSocket Receiver
            </button>
            <button onClick={handlePlay}>
                Play Received Audio
            </button>
        </div>
    );
};

export default ReceiverHandler;
