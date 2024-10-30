function playAudio(audioChunks: Float32Array[], sampleRate = 44100) {
    const audioContext = new AudioContext({ sampleRate });

    // Filter out any empty chunks
    const validChunks = audioChunks.filter(chunk => chunk.length > 0);

    if (validChunks.length === 0) {
        console.error("No valid audio data available to play.");
        return;
    }

    // Calculate the total length of valid chunks
    const totalLength = validChunks.reduce((sum, chunk) => sum + chunk.length, 0);

    if (totalLength <= 0) {
        console.error("Total audio length is zero after filtering. Unable to play.");
        return;
    }

    // Create an audio buffer with the total length of valid chunks
    const audioBuffer = audioContext.createBuffer(1, totalLength, sampleRate);

    // Copy each valid chunk into the audio buffer
    let offset = 0;
    for (const chunk of validChunks) {
        audioBuffer.copyToChannel(chunk, 0, offset);
        offset += chunk.length;
    }

    // Clear audioChunks after they are copied to the buffer
    audioChunks.length = 0;

    // Create a buffer source node to play the concatenated audio
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Connect the source to the audio context destination
    source.connect(audioContext.destination);

    // Start playback
    source.start();
}

export default playAudio;
