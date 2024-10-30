from flask import Flask
from flask_socketio import SocketIO, request
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Directory where the audio files will be saved
SAVE_DIR = 'received_audio_files'
os.makedirs(SAVE_DIR, exist_ok=True)

# Dictionary to store data received per client
audio_data_per_client = {}

@app.route('/')
def index():
    return "WebSocket Server Running"

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('audio-stream')
def handle_audio_stream(data):
    sid = request.sid  # Get the session ID for the connected client
    
    if sid not in audio_data_per_client:
        audio_data_per_client[sid] = b''

    if data:
        print(f"Received audio data of length: {len(data)} bytes from client {sid}")
        audio_data_per_client[sid] += data  # Accumulate the audio data
    else:
        # Save the accumulated audio data to a file when the stream ends
        print(f'Audio stream stopped from client {sid}, saving file...')
        save_audio_to_file(sid)

def save_audio_to_file(sid):
    # Save the accumulated audio data to a WAV file
    if sid in audio_data_per_client:
        file_path = os.path.join(SAVE_DIR, f'{sid}_audio.wav')
        with open(file_path, 'wb') as audio_file:
            audio_file.write(audio_data_per_client[sid])
        print(f'Saved audio file: {file_path}')
        # Clear the saved data after saving
        del audio_data_per_client[sid]

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
