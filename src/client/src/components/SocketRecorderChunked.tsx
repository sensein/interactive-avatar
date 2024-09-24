import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Box, Typography, Paper } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';
import io from 'socket.io-client';
import RecordRTC from 'recordrtc';

const chunkSize = 1024; // Matching the backend chunk size

interface SocketRecorderChunkedProps {
    onTranscription: (text: string) => void;
    onVisemes: (visemes: any[]) => void;
  }
  
  const SocketRecorderChunked: React.FC<SocketRecorderChunkedProps> = ({ onTranscription, onVisemes }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [receivedAudioUrl, setReceivedAudioUrl] = useState<string | null>(null);
    const [transcribedText, setTranscribedText] = useState<string | null>(null);
    const [visemes, setVisemes] = useState<any[]>([]);
  
    const socketSendRef = useRef<any>(null);
    const socketReceiveRef = useRef<any>(null);
    const recorderRef = useRef<any>(null);
  
    useEffect(() => {
      socketSendRef.current = io('http://localhost:12345');
      socketReceiveRef.current = io('http://localhost:12346');
  
      socketReceiveRef.current.on('response', (data: ArrayBuffer) => {
        const packet = deserializePacket(data);
  
        if (packet.audio) {
          const audioBlob = new Blob([packet.audio], { type: 'audio/wav' });
          setReceivedAudioUrl(URL.createObjectURL(audioBlob));
        }
        if (packet.text) {
          setTranscribedText(packet.text);
          onTranscription(packet.text); // Notify parent
        }
        if (packet.visemes) {
          setVisemes(packet.visemes);
          onVisemes(packet.visemes); // Notify parent
        }
      });
  
      return () => {
        socketSendRef.current.disconnect();
        socketReceiveRef.current.disconnect();
      };
    }, [onTranscription, onVisemes]);

  // Start recording audio
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new RecordRTC(stream, { type: 'audio' });
    recorderRef.current = recorder;
    recorder.startRecording();
    setIsRecording(true);
  };

  // Stop recording and send audio to the server in chunks
  const stopRecording = async () => {
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();

      // Convert Blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Send audio data in chunks to the server
      for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
        const chunk = arrayBuffer.slice(i, i + chunkSize);
        socketSendRef.current.emit('audio', chunk); // Send each chunk to the server
      }

      setAudioUrl(URL.createObjectURL(blob)); // Save and display locally
    });
    setIsRecording(false);
  };

  // Helper function to deserialize the received packet
  const deserializePacket = (data: ArrayBuffer) => {
    // Assuming that the server sends the packet using pickle
    const textDecoder = new TextDecoder();
    const jsonStr = textDecoder.decode(new Uint8Array(data));
    return JSON.parse(jsonStr); // Convert the data to a JavaScript object
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <Typography variant="h5">Voice Interaction</Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
          {!isRecording ? (
            <IconButton color="primary" onClick={startRecording} size="large">
              <Mic fontSize="large" />
            </IconButton>
          ) : (
            <IconButton color="error" onClick={stopRecording} size="large">
              <Stop fontSize="large" />
            </IconButton>
          )}
        </Box>
        <Typography variant="body1" sx={{ marginTop: '10px' }}>
          {isRecording ? 'Recording...' : 'Click to start recording'}
        </Typography>

        {audioUrl && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h6">Your Recording</Typography>
            <Button variant="contained" color="secondary" startIcon={<PlayArrow />} onClick={() => new Audio(audioUrl).play()}>
              Play Recording
            </Button>
            <audio controls src={audioUrl} />
          </Box>
        )}

        {receivedAudioUrl && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h6">Processed Audio from Server</Typography>
            <Button variant="contained" color="primary" startIcon={<PlayArrow />} onClick={() => new Audio(receivedAudioUrl).play()}>
              Play Processed Audio
            </Button>
            <audio controls src={receivedAudioUrl} />
          </Box>
        )}

        {transcribedText && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h6">Transcribed Text</Typography>
            <Typography>{transcribedText}</Typography>
          </Box>
        )}

        {visemes.length > 0 && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h6">Visemes</Typography>
            {visemes.map((viseme, index) => (
              <Typography key={index}>{`${viseme.timestamp}: ${viseme.viseme}`}</Typography>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SocketRecorderChunked;
