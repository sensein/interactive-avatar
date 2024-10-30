import { FUPCMPlayer as PCMPlayer } from 'pcm-stream-player';

interface PlayAudioParams {
    audioQueue: Int16Array[];
};

const playAudio = ({ audioQueue }: PlayAudioParams) => {
    // Initialize PCMPlayer with int16 settings
    const player = new PCMPlayer({
        encoding: '16bitInt', // Set encoding to match the incoming int16 format
        channels: 1,
        sampleRate: 44100, // Adjust to your audio's sample rate
        flushingTime: 100, // Set as needed for smooth playback
    });

    const playAudio = () => {
        // Feed each chunk from the queue to the player
        while (audioQueue.length > 0) {
            console.log("Audio player: playAudio")
            const chunk = audioQueue.shift(); // Get the next chunk
            if (chunk) {
                console.log(chunk, chunk.length);
                player.feed(chunk); // Feed chunk to PCMPlayer
            }
        }
    };

    // Set up interval to check and play audio chunks at regular intervals
    const intervalId = setInterval(() => {
        playAudio();
    }, 100); // Adjust interval as needed for smooth playback

    // Return a function to stop playback
    return () => clearInterval(intervalId);
};

export default playAudio
