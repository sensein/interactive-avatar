import React from 'react';

interface Viseme {
  viseme: string;
  start: number;
  duration: number;
}

interface DisplayAndPlayProps {
  transcription: string | null;
  visemes: Viseme[];
  audioUrl: string | null;
  playAudio: () => void;
}

const DisplayAndPlay: React.FC<DisplayAndPlayProps> = ({ transcription, visemes, audioUrl, playAudio }) => {
  return (
    <div>
      {transcription ? (
        <>
          <h3>Transcription: {transcription}</h3>
          <h4>Visemes:</h4>
          <ul>
            {visemes.map((viseme, index) => (
              <li key={index}>
                Viseme: {viseme.viseme}, Start: {viseme.start}, Duration: {viseme.duration}
              </li>
            ))}
          </ul>
          {audioUrl ? <button onClick={playAudio}>Play Audio</button> : <p>Audio not available</p>}
        </>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default DisplayAndPlay;
