from typing import Dict
import socket
import threading
from queue import Queue
import pickle
import struct

def send_sts(
    host: str = "localhost",
    send_port: int = 12345,
    # send_rate: int = 16000,
    # chunk_size: int = 512,
    queues: Dict[str, Queue] = {},
    stop_event: threading.Event = threading.Event(),
) -> None:
    send_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.connect((host, send_port))

    print("Recording and streaming...")

    while not stop_event.is_set():
        # Fill packet from each queue
        packet = {}
        for key, queue in queues.items():
            if not queue.empty():
                data = queue.get()
                if data is not None:
                    packet[key] = data
        
        if packet: # Only send if there's data in the packet

            # Serialize the packet using pickle
            serialized_packet: bytes = pickle.dumps(packet)

            # Compute the length of the serialized packet
            packet_length: int = len(serialized_packet)

            # Send the packet length as a 4-byte integer using struct
            send_socket.sendall(struct.pack('!I', packet_length))

            # Send the serialized packet
            send_socket.sendall(serialized_packet)

        # if 'audio' in data and data['audio'] is not None:
        #     if isinstance(audio_chunk, bytes) and audio_chunk == b"END":
        #         print("end is found!!!!!")
        #         break
