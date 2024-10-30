import { useEffect, useState } from 'react';

interface Viseme {
  viseme: string;
  start: number;
  duration: number;
}

interface DataResponse {
  audio: string;
  text: string;
  visemes: Viseme[];
}

const useReceiver = ({ host = "http://localhost", port = 5002 }) => {
  const [data, setData] = useState<DataResponse | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${host}:${port}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: DataResponse) => {
        setData(data);

        // Decode base64 audio to create a Blob URL
        const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => console.error('Error playing audio:', error));
    }
  };

  return { data, audioUrl, playAudio };
};

export default useReceiver;
