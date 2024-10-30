import socket
import threading
from queue import Queue
import struct
import pickle
import wave
from dataclasses import dataclass, field
from transformers import HfArgumentParser
from typing import Optional, Dict, Any

@dataclass
class FrontendReceiveArguments:
    recv_rate: int = field(
        default=16000,
        metadata={"help": "In Hz. Default is 16000."}
    )
    list_play_chunk_size: int = field(
        default=512,
        metadata={"help": "The size of data chunks (in bytes). Default is 512."},
    )
    host: str = field(
        default="localhost",
        metadata={
            "help": "The hostname or IP address for listening and playing. Default is 'localhost'."
        },
    )
    recv_port: int = field(
        default=12346,
        metadata={"help": "The network port for receiving data. Default is 12346."},
    )

def save_audio_to_wav(filename: str, audio_data: bytes, sample_rate: int) -> None:
    """Save raw audio data to a WAV file."""
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono audio
        wav_file.setsampwidth(2)  # 16-bit audio is 2 bytes per sample (int16)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data)

def recv_data(
    recv_rate=16000,
    list_play_chunk_size=512,
    host="localhost",
    recv_port=12346,
):
    recv_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    recv_socket.connect((host, recv_port))

    print("Listening and receiving...")

    stop_event = threading.Event()
    recv_queue = Queue()

    def recv(stop_event, recv_queue) -> None:
        def receive_full_chunk(conn: socket.socket, chunk_size: int) -> Optional[bytes]:
            data = b""
            while len(data) < chunk_size:
                packet = conn.recv(chunk_size - len(data))
                if not packet:
                    return None  # Connection has been closed
                data += packet
            return data

        audio_buffer = b""

        while not stop_event.is_set():
            # print("Waiting to receive the length of the next packet...")
            
            # Step 1: Receive the first 4 bytes to get the packet length
            length_data = receive_full_chunk(recv_socket, 4)

            print(length_data)

            
            if not length_data:
                # print("No length data received, connection might have been closed.")
                continue  # Handle disconnection or data not available

            # Step 2: Unpack the length (4 bytes, as an int)
            packet_length: int = struct.unpack('!I', length_data)[0]
            print(f"Expecting packet of length: {packet_length} bytes")

            # Step 3: Receive the full packet based on the length
            serialized_packet = receive_full_chunk(recv_socket, packet_length)
            if not serialized_packet:
                print("No packet data received, connection might have been closed.")
                continue

            # Step 4: Deserialize the packet using pickle
            try:
                packet: Dict[str, Any] = pickle.loads(serialized_packet)
                print(f"Received packet: {packet}")

                # Step 5: Extract and process the packet contents
                if 'text' in packet:
                    print(f"Received text: {packet['text']}")
                if 'visemes' in packet:
                    print(f"Received visemes: {packet['visemes']}")

                # Step 6: Put the packet audio data into the buffer for saving
                if 'audio' in packet:
                    audio_buffer += packet['audio']

                # End the connection if the audio contains the end signal
                if 'audio' in packet and packet['audio'] == b"END":
                    print("Received end signal. Closing connection.")
                    break

            except pickle.UnpicklingError as e:
                print(f"Error unpickling data: {e}")

        # After receiving all data, save the audio
        if audio_buffer:
            save_audio_to_wav('received_audio_from_backend.wav', audio_buffer, recv_rate)
            print("Audio saved to received_audio_from_backend.wav")

    recv_thread = threading.Thread(target=recv, args=(stop_event, recv_queue))
    recv_thread.start()

    # try:
    #     input("Press Enter to stop receiving...\n")
    # finally:
    stop_event.set()
    recv_thread.join()
    recv_socket.close()
    print("Connection closed.")

if __name__ == "__main__":
    parser = HfArgumentParser((FrontendReceiveArguments,))
    (recv_args,) = parser.parse_args_into_dataclasses()
    recv_data(**vars(recv_args))
