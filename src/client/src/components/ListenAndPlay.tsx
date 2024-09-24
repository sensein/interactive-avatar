import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Box, Typography, Paper } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';
import io, { Socket } from 'socket.io-client';
import RecordRTC from 'recordrtc';

const SocketRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [receivedAudioUrl, setReceivedAudioUrl] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [visemes, setVisemes] = useState<any[]>([]);

  const socketSendRef = useRef<typeof Socket | null>(null);
  const socketReceiveRef = useRef<typeof Socket | null>(null);
  const recorderRef = useRef<any>(null);

  useEffect(() => {
    socketSendRef.current = io('http://localhost:12345');  // Sending socket connection
    socketReceiveRef.current = io('http://localhost:12346');  // Receiving socket connection

    // Handle receiving data (audio, text, visemes) from the server
    socketReceiveRef.current.on('response', (data: ArrayBuffer) => {
      const packet = deserializePacket(data);  // Deserialize data

      if (packet.audio) {
        const audioBlob = new Blob([packet.audio], { type: 'audio/wav' });
        setReceivedAudioUrl(URL.createObjectURL(audioBlob));  // Play received audio
      }
      if (packet.text) {
        setTranscribedText(packet.text);  // Display transcribed text
      }
      if (packet.visemes) {
        setVisemes(packet.visemes);  // Store visemes
      }
    });

    return () => {
      socketSendRef.current?.disconnect();
      socketReceiveRef.current?.disconnect();
    };
  }, []);

  // Start recording audio
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new RecordRTC(stream, { type: 'audio' });
    recorderRef.current = recorder;
    recorder.startRecording();
    setIsRecording(true);
  };

  // Stop recording and send audio to server
  const stopRecording = async () => {
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      const arrayBuffer = await blob.arrayBuffer();

      // Send audio data to the server
      socketSendRef.current?.emit('audio', arrayBuffer);

      setAudioUrl(URL.createObjectURL(blob));  // Display locally
    });
    setIsRecording(false);
  };

  // Helper to deserialize the packet from the server
  const deserializePacket = (data: ArrayBuffer) => {
    const textDecoder = new TextDecoder();
    const jsonStr = textDecoder.decode(new Uint8Array(data));
    return JSON.parse(jsonStr);  // Parse as JSON
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

export default SocketRecorder;