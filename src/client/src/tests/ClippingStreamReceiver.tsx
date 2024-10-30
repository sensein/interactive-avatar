import React, { useEffect, useState, useRef } from 'react';

const AudioReceiver: React.FC = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const audioEndTimeRef = useRef<number>(0);
  const MIN_BUFFER_SIZE = 3;  // Minimum chunks to buffer before starting playback

  const handleConnect = () => {
    setIsConnected(true);
    const newAudioContext = new window.AudioContext();
    setAudioContext(newAudioContext);
    audioEndTimeRef.current = newAudioContext.currentTime;
  };

  const setupSocket = () => {
    const ws = new WebSocket("ws://localhost:5002");
    ws.binaryType = "arraybuffer";  // Expect binary data
    
    ws.onopen = () => {
      console.log("WebSocket connection opened");
    };
    
    ws.onmessage = (event) => {
      const audioChunk = event.data;  // Raw ArrayBuffer (int16 PCM)
      const int16Array = new Int16Array(audioChunk);
      const float32Array = convertInt16ToFloat32(int16Array);

      audioQueueRef.current.push(float32Array);

      // Start playback once we have enough buffered chunks
      if (!isPlayingRef.current && audioQueueRef.current.length >= MIN_BUFFER_SIZE) {
        playNextChunk();
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

  const playNextChunk = () => {
    if (!audioContext || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;

    const audioChunk = audioQueueRef.current.shift();
    if (!audioChunk) {
      isPlayingRef.current = false;
      return;
    }

    const buffer = audioContext.createBuffer(1, audioChunk.length, audioContext.sampleRate);
    buffer.copyToChannel(audioChunk, 0);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const currentTime = audioContext.currentTime;
    const startTime = Math.max(audioEndTimeRef.current, currentTime);
    source.start(startTime);

    audioEndTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      if (audioQueueRef.current.length > 0) {
        playNextChunk();
      } else {
        isPlayingRef.current = false;
      }
    };
  };

  return (
    <div>
      <h1>Audio Receiver</h1>
      <button onClick={handleConnect} disabled={isConnected}>
        Connect to WebSocket
      </button>
    </div>
  );
};

export default AudioReceiver;