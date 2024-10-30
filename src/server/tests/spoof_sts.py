import sys
sys.path.append('..')
import threading
import queue
import wave
import numpy as np
from scipy.signal import resample
from STS.connections.socket_receiver import SocketReceiver
from STS.connections.socket_sender import SocketSender

def spoof_sts(wav_file_path="sample_audio.wav"):
    stop_event = threading.Event()
    should_listen = threading.Event()

    # Socket queues
    recv_queue = queue.Queue()
    send_queue = queue.Queue()

    # Packing queues
    text_queue = queue.Queue()
    visemes_queue = queue.Queue()
    audio_queue = queue.Queue()

    receiver = SocketReceiver(
        stop_event=stop_event,
        queue_out=recv_queue,
        should_listen=should_listen,
        host="127.0.0.1",
        port=12345,
        chunk_size=1024,
    )

    sender = SocketSender(
        stop_event=stop_event,
        queue_in=send_queue,
        host="127.0.0.1",
        port=12346,
    )

    def add_data():
        while not stop_event.is_set():
            input("Press Enter to add data...")

            # Add text/visemes/audio
            text_queue.put("This is a spoofed text message.")
            visemes_queue.put(
                [
                    {'viseme': 1, 'timestamp': 0.1},
                    {'viseme': 2, 'timestamp': 0.2},
                    {'viseme': 3, 'timestamp': 0.3},
                ]
            )
            with wave.open(wav_file_path, 'rb') as wav_file:
                original_sample_rate = wav_file.getframerate()  # Retrieve the sample rate from the file
                print(f"Sample rate of audio file: {original_sample_rate} Hz")

                target_sample_rate = 44100
                resample_ratio = target_sample_rate / original_sample_rate

                while not stop_event.is_set():
                    # Read frames from the WAV file
                    frame_data = wav_file.readframes(512)
                    if not frame_data:
                        print("End of audio file reached")
                        break

                    # Convert frame data to NumPy array in expected format
                    audio_chunk: np.ndarray = np.frombuffer(frame_data, dtype=np.int16)

                    new_length = int(len(audio_chunk) * resample_ratio)
                    resampled_audio_chunk = resample(audio_chunk, new_length).astype(np.int16)

                    audio_queue.put(resampled_audio_chunk)
    
    def recv():
        while not stop_event.is_set():
            # Wait for data to be received
            if not recv_queue.empty():
                audio_chunk = recv_queue.get()
                if audio_chunk == b"END":
                    print("Connection closed by sender.")
                    break
                # Print received audio chunk information
                print(f"Received Audio Chunk: {audio_chunk[:10]}... (showing first 10 bytes)")
    
    def send():
        while not stop_event.is_set():
            data = {}
            if not text_queue.empty():
                data['text'] = text_queue.get()
            if not visemes_queue.empty():
                data['visemes'] = visemes_queue.get()
            if not audio_queue.empty():
                data['audio'] = audio_queue.get()

            if data:
                send_queue.put(data)
                print(f"Sent data: {list(data.keys())}")

    # Start
    receiver_thread = threading.Thread(target=receiver.run, daemon=True)
    sender_thread = threading.Thread(target=sender.run, daemon=True)
    recv_thread = threading.Thread(target=recv, daemon=True)
    send_thread = threading.Thread(target=send, daemon=True)
    add_data_thread = threading.Thread(target=add_data, daemon=True)

    receiver_thread.start()
    sender_thread.start()
    recv_thread.start()
    send_thread.start()
    add_data_thread.start()

    try:
        while not stop_event.is_set():
            pass
    except KeyboardInterrupt:
        print("Stopping all threads...")
        stop_event.set()
        
        # Wait for all threads to finish
        receiver_thread.join()
        sender_thread.join()
        recv_thread.join()
        send_thread.join()
        add_data_thread.join()
        print("All threads stopped.")


if __name__ == "__main__":
    wav_file_path = "sample_audio.wav"  # Replace with your wav file path if needed
    # spoofer = SpoofSTS(wav_file_path=wav_file_path)
    # spoofer.run()
    spoof_sts("sample_audio.wav")
