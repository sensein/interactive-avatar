# Import eventlet monkey_patch at the top before importing other modules
import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_socketio import SocketIO, emit
import wave

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

def stream_audio(filepath):
    """Stream audio in small chunks from a WAV file."""
    with wave.open(filepath, 'rb') as wav_file:
        chunk_size = 1024  # Number of frames to read per chunk
        data = wav_file.readframes(chunk_size)
        while data:
            socketio.emit('audio_chunk', data)
            eventlet.sleep(0.01)  # Small delay to simulate streaming
            data = wav_file.readframes(chunk_size)

@socketio.on('request_audio')
def handle_request_audio():
    print("Client requested audio stream...")
    # Stream the audio file to the client
    stream_audio('sample_audio.wav')

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
