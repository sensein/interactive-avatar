import socket
import threading
from queue import Queue
import struct
import pickle
from typing import Optional, Dict, Union, List, Any
import numpy as np

def recv_sts(
    host: str = "localhost",
    recv_port: int = 12346,
    # recv_rate: int = 44100,
    # chunk_size: int = 512,
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
    recv_socket.connect((host, recv_port))

    print("Recording and streaming...")

    while not stop_event.is_set():
        # Step 1: Receive the first 4 bytes to get the packet length
        length_data: Optional[bytes] = receive_full_chunk(recv_socket, 4)
        if not length_data:
            continue  # Handle disconnection or data not available

        # Step 2: Unpack the length (4 bytes, as an int)
        packet_length: int = struct.unpack('!I', length_data)[0]

        # Step 3: Receive the full packet based on the length
        serialized_packet: Optional[bytes] = receive_full_chunk(recv_socket, packet_length)
        if serialized_packet:
            # Step 4: Deserialize the packet using pickle (json format)
            packet: Dict[str, Any] = pickle.loads(serialized_packet)

            # Step 5: Extract the packet contents
            # for key, queue in queues:
            #     if key in packet:
            #         queue.put(packet[key])
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
                audio: bytes = audio.tobytes()
                queues['audio'].put(audio)
                print("AUDIO")

                    # TODO: The audio is currently being sent from sts as "np.ndarray".
                    #       Fix so that it's a byte stream,
                    #       which I believe won't need to be transformed
                    #       to be sent to the client.
