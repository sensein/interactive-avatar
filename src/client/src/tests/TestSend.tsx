import React, { useRef, useEffect } from "react";
import RecordRTC from "recordrtc";

const AudioStreamSender: React.FC = () => {
  const recorderRef = useRef<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const websocketUrl = "ws://localhost:5001";

  useEffect(() => {
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
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      recorderRef.current = RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 100, // Send audio data every 100 ms
        ondataavailable: (blob: any) => {
          // Create a file reader to read the blob in 1024-byte chunks
          const reader = new FileReader();
          reader.readAsArrayBuffer(blob);
          reader.onloadend = () => {
            if (reader.result && wsRef.current?.readyState === WebSocket.OPEN) {
              const buffer = new Uint8Array(reader.result as ArrayBuffer);
              let offset = 0;
              while (offset < buffer.length) {
                const chunk = buffer.slice(offset, offset + 1024);
                wsRef.current.send(chunk);
                offset += 1024;
              }
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

  return (
    <div>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
    </div>
  );
};

export default AudioStreamSender;
