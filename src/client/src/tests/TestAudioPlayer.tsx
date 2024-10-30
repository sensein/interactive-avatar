import React, { useEffect, useState, useRef } from 'react';

type Message = {
    type: 'text' | 'visemes' | 'audio';
    data: string | Array<{ viseme: number; timestamp: number }>;
};

const TestAudioPlayer: React.FC = () => {
    const [text, setText] = useState<string>('');
    const [visemesQueue, setVisemesQueue] = useState<Array<{ viseme: number; timestamp: number }>>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:5002');
        ws.binaryType = "arraybuffer"; // Set binaryType to handle binary data properly

        ws.onopen = () => {
            console.log('Connected to WebSocket server.');
        };

        ws.onmessage = async (event) => {
            let jsonMessage: Message;

            // If the message is an ArrayBuffer, convert it to text
            if (event.data instanceof ArrayBuffer) {
                const textData = new TextDecoder("utf-8").decode(event.data);
                jsonMessage = JSON.parse(textData);
            } else {
                // For regular JSON string messages
                jsonMessage = JSON.parse(event.data);
            }

            switch (jsonMessage.type) {
                case 'text':
                    setText(jsonMessage.data as string);
                    break;
                case 'visemes':
                    setVisemesQueue(jsonMessage.data as Array<{ viseme: number; timestamp: number }>);
                    break;
                case 'audio':
                    const audioBytes = new Uint8Array(
                        atob(jsonMessage.data as string).split('').map(char => char.charCodeAt(0))
                    );
                    playPCM(audioBytes);
                    break;
                default:
                    console.error("Unknown message type:", jsonMessage.type);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server.');
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            ws.close();
        };
    }, []);

    // Function to play PCM audio data directly
    const playPCM = (audioBytes: Uint8Array) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 44100 });
        }
        const audioContext = audioContextRef.current;

        // Convert PCM data to Float32Array
        const floatArray = new Float32Array(audioBytes.length / 2);
        for (let i = 0; i < audioBytes.length; i += 2) {
            // Convert 16-bit PCM to float (-1.0 to 1.0)
            const int16 = (audioBytes[i + 1] << 8) | audioBytes[i];
            floatArray[i / 2] = int16 / 32768;
        }

        // Create an AudioBuffer and fill it with PCM data
        const buffer = audioContext.createBuffer(1, floatArray.length, audioContext.sampleRate);
        buffer.copyToChannel(floatArray, 0);

        // Play the buffer
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    };

    return (
        <div>
            <h3>WebSocket Client</h3>
            <p>Text: {text}</p>
            <p>Visemes Queue: {JSON.stringify(visemesQueue)}</p>
            <p>Audio is playing on receipt...</p>
        </div>
    );
};

export default TestAudioPlayer;
