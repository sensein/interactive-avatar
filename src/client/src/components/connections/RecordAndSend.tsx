import React, { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";

interface RecordAndSendProps {
    host: string;
    port: number;
    sampleRate: number;
    chunkSize: number;
}

const RecordAndSend: React.FC<RecordAndSendProps> = ({ host = "localhost", port = 5001, sampleRate = 44100, chunkSize = 512 }) => {
    const recorderRef = useRef<any | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const bufferRef = useRef<Int16Array>(new Int16Array(0));
    const websocketUrl = `ws://${host}:${port}`;

    const handleConnect = () => {
        setIsConnected(true);
    };

    useEffect(() => {
        if (!isConnected) return;

        wsRef.current = new WebSocket(websocketUrl);
        wsRef.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        wsRef.current.onclose = () => {
            console.log("WebSocket connection closed");
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [isConnected]);

    const startRecording = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            recorderRef.current = RecordRTC(stream, {
                type: "audio",
                mimeType: "audio/wav",
                recorderType: RecordRTC.StereoAudioRecorder,
                desiredSampleRate: sampleRate,
                timeSlice: 100,  /* Send audio data every 100 ms */
                ondataavailable: (blob: Blob) => {
                    const reader = new FileReader();
                    reader.readAsArrayBuffer(blob);
                    reader.onloadend = () => {
                        if (reader.result && wsRef.current?.readyState === WebSocket.OPEN) {
                            const float32Array = new Float32Array(reader.result as ArrayBuffer);
                            const int16Array = convertFloat32ToInt16(float32Array);

                            const newBuffer = new Int16Array(bufferRef.current.length + int16Array.length);
                            newBuffer.set(bufferRef.current);
                            newBuffer.set(int16Array, bufferRef.current.length);
                            bufferRef.current = newBuffer;

                            while (bufferRef.current.length >= chunkSize) {
                                const chunk = bufferRef.current.slice(0, chunkSize);
                                wsRef.current.send(chunk);
                                bufferRef.current = bufferRef.current.slice(chunkSize);
                            }

                            // let offset = 0;
                            // while (offset < int16Array.length) {
                            //     const chunk = int16Array.slice(offset, offset + chunkSize);

                            //     console.log(chunk.length);

                            //     wsRef.current.send(chunk);
                            //     offset += chunkSize;
                            // }
                        }
                    };
                },
            });

            recorderRef.current.startRecording();
        });
    };

    const stopRecording = () => {
        if (recorderRef.current) {
            recorderRef.current.stopRecording(() => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            });
        }
    };

    const convertFloat32ToInt16 = (float32Array: Float32Array): Int16Array => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Array[i]));  /* Clip between -1 and 1 */
            int16Array[i] = Math.round(sample * 32767);  /* Scale to int16 range */
        }
        return int16Array;
    };
    
    return (
        <div>
            <h1>Audio Streaming App</h1>
            <button onClick={handleConnect} disabled={isConnected}>
                Connect to WebSocket Receiver
            </button>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={stopRecording}>Stop Recording</button>
        </div>
    );
};

export default RecordAndSend;
