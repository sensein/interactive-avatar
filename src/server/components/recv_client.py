import socket
import threading
from queue import Queue
import struct
import pickle
from typing import Optional, Dict, Union, List, Any
import numpy as np

def recv_client(
    host: str = "localhost",
    recv_port: int = 12346,
    queues: Dict[str, Queue] = {},
    stop_event: threading.Event = threading.Event(),
) -> None:
    # Get data as a certain number of bytes
    def receive_full_chunk(conn: socket.socket, chunk_size: int) -> Optional[bytes]:
        data: bytes = b""
        while len(data) < chunk_size:
            packet: bytes = conn.recv(chunk_size - len(data))
            if not packet:
                return None  # Connection has been closed
            data += packet
        return data

    # Setup socket
    recv_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    recv_socket.bind((host, recv_port))
    recv_socket.listen(1)
    print("Waiting for a connection...")
    conn, addr = recv_socket.accept()
    print(f"Connected by {addr}")

    while not stop_event.is_set():
        # Step 1: Receive the first 4 bytes to get the packet length
        length_data: Optional[bytes] = receive_full_chunk(conn, 4)
        if not length_data:
            print('continuing')
            continue  # Handle disconnection or data not available

        # Step 2: Unpack the length (4 bytes, as an int)
        packet_length: int = struct.unpack('!I', length_data)[0]

        # Step 3: Receive the full packet based on the length
        serialized_packet: Optional[bytes] = receive_full_chunk(conn, packet_length)
        if serialized_packet:
            # Step 4: Deserialize the packet using pickle (json format)
            packet: Dict[str, Any] = pickle.loads(serialized_packet)

            # Step 5: Extract the packet contents
            if 'text' in packet:
                text: str = packet['text']
                queues['text'].put(text)
                print(text)
                print("TEXT")
            if 'visemes' in packet:
                visemes: List[Dict[str, Union[str, float]]] = packet['visemes']
                queues['visemes'].put(visemes)
                print(visemes)
                print("VISEMES")
            if 'audio' in packet:
                # Step 6: Put the packet audio data into the queue for sending
                audio: np.ndarray = packet['audio']
                audio_bytes: bytes = audio.tobytes()
                queues['audio'].put(audio_bytes)
                print("AUDIO")

    conn.close()
    recv_socket.close()

if __name__ == "__main__":
    queues = {
        "audio": Queue(),
        "text": Queue(),
        "visemes": Queue(),
    }
    stop_event = threading.Event()
    recv_client(queues=queues, stop_event=stop_event)
