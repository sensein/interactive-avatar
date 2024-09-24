import React, { useState, useRef } from 'react';
import RecordRTC from 'recordrtc';
import { Container, Button, IconButton, Box, Typography, Paper } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [receivedAudioUrl, setReceivedAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<any>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new RecordRTC(stream, { type: 'audio' });
    recorderRef.current = recorder;
    recorder.startRecording();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      audioBlobRef.current = blob;
      setAudioUrl(URL.createObjectURL(blob));

      // Send the recorded audio to the server (send_port 12345)
      const formData = new FormData();
      formData.append('audio', blob);

      await fetch('http://localhost:12345', {
        method: 'POST',
        body: formData,
      });

      // After sending, start listening to receive audio from recv_port 12346
      await receiveAudio();
    });
    setIsRecording(false);
  };

  const receiveAudio = async () => {
    // Fetch received audio data from the server (recv_port 12346)
    const response = await fetch('http://localhost:12346');
    const blob = await response.blob();
    setReceivedAudioUrl(URL.createObjectURL(blob));
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <Typography variant="h5" gutterBottom>
          Audio Recorder
        </Typography>
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
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayArrow />}
              onClick={() => new Audio(audioUrl).play()}
            >
              Play Recording
            </Button>
            <Box sx={{ marginTop: '10px' }}>
              <audio controls src={audioUrl} />
            </Box>
          </Box>
        )}
        {receivedAudioUrl && (
          <Box sx={{ marginTop: '30px' }}>
            <Typography variant="h6">Received Audio</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => new Audio(receivedAudioUrl).play()}
            >
              Play Received Audio
            </Button>
            <Box sx={{ marginTop: '10px' }}>
              <audio controls src={receivedAudioUrl} />
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default App;
