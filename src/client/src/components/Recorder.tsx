import React, { useState, useRef } from 'react';
import RecordRTC from 'recordrtc';
import { Container, Button, IconButton, Box, Typography, Paper } from '@mui/material';
import { Mic, Stop, PlayArrow } from '@mui/icons-material';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<any>(null);

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
      const formData = new FormData();
      formData.append('audio', blob);

      // Send to server (optional)
      const response = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setAudioUrl(data.audioUrl); // Assuming the server returns the audio URL
    });
    setIsRecording(false);
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
      </Paper>
    </Container>
  );
};

export default App;
