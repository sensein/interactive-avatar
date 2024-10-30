import threading
from queue import Queue
from STS.connections.socket_receiver import SocketReceiver  # Assuming socket_receiver.py is in the same directory
from threading import Event
import wave

# Constants for WAV file parameters
SAMPLE_RATE = 16000  # The sample rate should match what was used when recording
CHANNELS = 1         # Mono audio
SAMPLE_WIDTH = 2     # 16-bit audio is 2 bytes per sample (int16)

def save_audio_to_wav(filename: str, audio_data: bytes) -> None:
    """Save raw audio data to a WAV file."""
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(CHANNELS)
        wav_file.setsampwidth(SAMPLE_WIDTH)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(audio_data)

def main():
    stop_event = Event()
    queue_out = Queue()
    should_listen = Event()

    # Create an instance of SocketReceiver
    receiver = SocketReceiver(
        stop_event=stop_event,
        queue_out=queue_out,
        should_listen=should_listen,
        host="localhost",  # The receiver listens on this host
        port=12345,        # This port should match the sender
        chunk_size=1024
    )

    # Start the receiver in a separate thread
    receiver_thread = threading.Thread(target=receiver.run)
    receiver_thread.start()

    print("Receiver started and waiting for data...")

    # Buffer to accumulate all received audio chunks
    audio_buffer = b""

    # Listen for data and save it to the buffer when received
    while not stop_event.is_set():
        if not queue_out.empty():
            data = queue_out.get()

            # Check if the connection was closed
            if data == b"END":
                print("Connection closed.")
                break

            # Log the received raw data length
            print(f"Received raw data of length: {len(data)} bytes")

            # Append the received audio chunk to the buffer
            audio_buffer += data

    # After receiving all data, save it to a .wav file
    save_audio_to_wav('received_audio.wav', audio_buffer)
    print("Audio saved to received_audio.wav")

    stop_event.set()
    receiver_thread.join()

if __name__ == "__main__":
    main()
