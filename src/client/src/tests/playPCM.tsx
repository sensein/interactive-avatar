import React, { useEffect } from 'react';

const playPCM: React.FC<{ audioData: ArrayBuffer }> = ({ audioData }) => {
    useEffect(() => {
        const _play = async () => {
            // Create an audio context
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });

            // Define the number of channels and the byte order (assuming little-endian, 16-bit PCM data)
            const channels = 1;
            const frameCount = audioData.byteLength / 2;
            const myAudioBuffer = audioCtx.createBuffer(channels, frameCount, audioCtx.sampleRate);

            const channelData = myAudioBuffer.getChannelData(0); // Getting buffer for the first channel
            
            // Convert PCM data to audio buffer format
            const dataView = new DataView(audioData);

            for (let i = 0; i < frameCount; i++) {
                // Little-endian: combine two bytes into a 16-bit signed integer
                const word = (dataView.getUint8(i * 2) & 0xff) + ((dataView.getUint8(i * 2 + 1) & 0xff) << 8);
                const signedWord = (word + 32768) % 65536 - 32768;
                channelData[i] = signedWord / 32768.0; // Normalize the value
            }

            // Create an audio buffer source node and play
            const source = audioCtx.createBufferSource();
            source.buffer = myAudioBuffer;
            source.connect(audioCtx.destination);
            source.start();
        };

        if (audioData) {
            _play();
        }
    }, [audioData]);

    return null; // No UI for the audio player component, purely functional
};

export default playPCM;
