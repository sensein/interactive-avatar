import threading
import queue
import time
import wave
import numpy as np
from STS.connections.socket_receiver import SocketReceiver
from STS.connections.socket_sender import SocketSender
from typing import Dict, List, Union

class SocketSpoofer:
    def __init__(self, wav_file_path):
        self.stop_event = threading.Event()
        self.queue_out = queue.Queue()  # Queue for SocketReceiver to send data to
        self.queue_in = queue.Queue()   # Queue for SocketSender to get data from
        self.should_listen = threading.Event()
        self.wav_file_path = wav_file_path
        
        self.receiver = SocketReceiver(
            stop_event=self.stop_event,
            queue_out=self.queue_out,
            should_listen=self.should_listen,
            host="127.0.0.1",
            port=12345
        )

        self.sender = SocketSender(
            stop_event=self.stop_event,
            queue_in=self.queue_in,
            host="127.0.0.1",
            port=12346
        )

    def spoof_input(self):
        # This method will simulate the reception of audio data by the receiver
        def receiver_simulation():
            try:
                with wave.open(self.wav_file_path, 'rb') as wav_file:
                    while not self.stop_event.is_set():
                        input("Press Enter to send audio chunk...")
                        # Read frames from the WAV file
                        frame_data = wav_file.readframes(1024)
                        if not frame_data:
                            print("End of audio file reached.")
                            break
                        # Convert frame data to NumPy array and process it to match the expected format
                        audio_chunk: np.ndarray = np.frombuffer(frame_data, dtype=np.int16)
                        # audio_chunk = (audio_chunk / 32768.0).astype(np.float32)  # Convert to float32 format
                        self.queue_out.put(audio_chunk)
            except FileNotFoundError:
                print(f"Error: The file {self.wav_file_path} was not found.")

        threading.Thread(target=receiver_simulation, daemon=True).start()

    def spoof_output(self):
        # This method will simulate the sending of audio/text/viseme data by the sender
        def sender_simulation():
            while not self.stop_event.is_set():
                if not self.queue_out.empty():
                    audio_data = self.queue_out.get()
                    if isinstance(audio_data, np.ndarray):
                        if len(audio_data) < 512:
                            audio_data = np.pad(audio_data, (0, 512 - len(audio_data)), mode='constant')
                        elif len(audio_data) > 512:
                            audio_data = audio_data[:512]  # Trim to match the expected length
                        spoofed_data: Dict[str, Union[np.ndarray, str, List[Dict[str, Union[str, float]]]]] = {
                            'audio': audio_data,  # Keep as NumPy array
                            'text': "This is a spoofed text message.",
                            'visemes': [
                                {'viseme': "v1", 'timestamp': 0.1},
                                {'viseme': "v2", 'timestamp': 0.2},
                                {'viseme': "v3", 'timestamp': 0.3}
                            ]
                        }
                        self.queue_in.put(spoofed_data)
                        print("Audio and data sent.")
                    else:
                        print("Unexpected data type in queue_out.")

        threading.Thread(target=sender_simulation, daemon=True).start()

    def run(self):
        receiver_thread = threading.Thread(target=self.receiver.run, daemon=True)
        sender_thread = threading.Thread(target=self.sender.run, daemon=True)
        
        receiver_thread.start()
        sender_thread.start()

        self.spoof_input()
        self.spoof_output()

        try:
            while True:
                time.sleep(.1)
        except KeyboardInterrupt:
            self.stop_event.set()
            receiver_thread.join()
            sender_thread.join()

if __name__ == "__main__":
    wav_file_path = "sample_audio.wav"  # Replace with your wav file path
    spoofer = SocketSpoofer(wav_file_path)
    spoofer.run()
