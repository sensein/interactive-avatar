import sys
sys.path.append('..')
import threading
import queue
import time
import wave
import numpy as np
from typing import Dict, List, Union
from STS.connections.socket_receiver import SocketReceiver
from STS.connections.socket_sender import SocketSender

class SpoofSTSSend:
    def __init__(self, wav_file_path):
        self.stop_event = threading.Event()
        self.queue_out = queue.Queue()
        self.queue_in = queue.Queue()
        self.queue_text = queue.Queue()
        self.queue_visemes = queue.Queue()
        self.queue_audio = queue.Queue()
        self.should_listen = threading.Event()
        self.wav_file_path = wav_file_path

        self.receiver = SocketReceiver(
            stop_event=self.stop_event,
            queue_out=self.queue_out,
            should_listen=self.should_listen,
            host="127.0.0.1",
            port=12345,
            chunk_size=1024,
        )

        self.sender = SocketSender(
            stop_event=self.stop_event,
            queue_in=self.queue_in,
            host="127.0.0.1",
            port=12346,
        )
    
    def create_audio(self):
        try:
            audio_frames = []
            with wave.open(self.wav_file_path, 'rb') as wav_file:
                while not self.stop_event.is_set():

                    # Read frames from the WAV file
                    frame_data = wav_file.readframes(512)
                    if not frame_data:
                        print("End of audio file reached")
                        break

                    # Convert frame data to NumPy array in expected format
                    audio_chunk: np.ndarray = np.frombuffer(frame_data, dtype=np.int16)
                    self.queue_audio.put(audio_chunk)
            return audio_frames

        except FileNotFoundError:
            print(f"Error: The file {self.wav_file_path} was not found.")

    def spoof_send(self):
        self.queue_text.put("This is a spoofed text message.")
        self.queue_visemes.put(
            [
                {'viseme': "v1", 'timestamp': 0.1},
                {'viseme': "v2", 'timestamp': 0.2},
                {'viseme': "v3", 'timestamp': 0.3},
            ]
        )
        self.create_audio()

        input("Press Enter to send data...\n")

        while not self.stop_event.is_set():
            

            spoofed_data: Dict[str, Union[np.ndarray, str, List[Dict[str, Union[str, float]]]]] = {}
            data_text = []

            # Add text/visemes/audio
            if not self.queue_text.empty():
                spoofed_data['text'] = self.queue_text.get()
                data_text.append("Text")
            if not self.queue_visemes.empty():
                spoofed_data['visemes'] = self.queue_visemes.get()
                data_text.append("Visemes")
            if not self.queue_audio.empty():
                spoofed_data['audio'] = self.queue_audio.get()
                data_text.append("Audio")
            
            # Sent data
            self.queue_in.put(spoofed_data)
            if data_text:
                print(f"{data_text} data sent.")
            else:
                print(f"No data sent.")

    def run(self):
        receiver_thread = threading.Thread(target=self.receiver.run, daemon=True)
        sender_thread = threading.Thread(target=self.sender.run, daemon=True)
        spoof_send_thread = threading.Thread(target=self.spoof_send, daemon=True)
        
        receiver_thread.start()
        sender_thread.start()
        spoof_send_thread.start()

        try:
            while True:
                time.sleep(.1)
        except KeyboardInterrupt:
            self.stop_event.set()
            sender_thread.join()
            spoof_send_thread.join()

if __name__ == "__main__":
    spoofer = SpoofSTSSend(wav_file_path="sample_audio.wav")
    spoofer.run()
