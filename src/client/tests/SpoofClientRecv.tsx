import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SpoofClientRecv: React.FC = () => {
  const [audioData, setAudioData] = useState<null | Blob>(null);
  const [visemeData, setVisemeData] = useState<null | string>(null);
  const [textData, setTextData] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to the socket server
    const socket = io('http://127.0.0.1:5002');

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('json-data', (data: any) => {
      if (data.audio) {
        const audioBytes = new Uint8Array(data.audio);
        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
        setAudioData(audioBlob);
      }
      if (data.visemes) {
        setVisemeData(JSON.stringify(data.visemes));
      }
      if (data.text) {
        setTextData(data.text);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
    });

    // Clean up the socket connection when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Server to Client Socket Data Transfer</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <h3>Text Data:</h3>
        <p>{textData || 'No text data received'}</p>
      </div>
      <div>
        <h3>Viseme Data:</h3>
        <p>{visemeData || 'No viseme data received'}</p>
      </div>
      <div>
        <h3>Audio Data:</h3>
        {audioData ? (
          <audio controls>
            <source src={URL.createObjectURL(audioData)} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <p>No audio data received</p>
        )}
      </div>
    </div>
  );
};

export default SpoofClientRecv;
