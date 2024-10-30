from typing import Dict, List, Union
import socket
import threading
from queue import Queue
import json
import base64
import struct

def send_client(
    host: str = "localhost",
    send_port: int = 5002,
    queues: Dict[str, Queue] = {},
    stop_event: threading.Event = threading.Event(),
) -> None:
    send_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.bind((host, send_port))
    send_socket.listen(1)
    print("Waiting for a connection...")
    conn, addr = send_socket.accept()
    print(f"Connected by {addr}")

    def send_packet(conn, queues):
        packet = {}
        for key, queue in queues.items():
            

    while not stop_event.is_set():
        packet = {}

        try:
            # Retrieve data from the queues
            if not queues['text'].empty():
                text: str = queues['text'].get()
                packet['text'] = text
                print("Sending text")

            if not queues['visemes'].empty():
                visemes: List[Dict[str, Union[str, float]]] = queues['visemes'].get()
                packet['visemes'] = visemes
                print("Sending visemes")

            if not queues['audio'].empty():
                audio: bytes = queues['audio'].get()
                # Base64 encode the audio bytes
                packet['audio'] = base64.b64encode(audio).decode('utf-8')
                print("Sending audio")

            if packet:  # Only send if there's data in the packet
                # Serialize the packet using JSON
                serialized_packet: str = json.dumps(packet)

                # Compute the length of the serialized packet
                packet_length: int = len(serialized_packet)

                # Send the packet length as a 4-byte integer using struct
                conn.sendall(struct.pack('!I', packet_length))

                # Send the serialized packet (as bytes)
                conn.sendall(serialized_packet.encode('utf-8'))

        except Exception as e:
            print(f"Error while sending data: {e}")

    conn.close()
    send_socket.close()

if __name__ == "__main__":
    queues = {
        "audio": Queue(),
        "text": Queue(),
        "visemes": Queue(),
    }

    # Adding sample data to the queues to verify functionality
    queues['text'].put("This is a test message.")
    queues['audio'].put(b"audio data")
    queues['visemes'].put([{'viseme': 'v1', 'timestamp': 0.1}])

    stop_event = threading.Event()
    send_client(queues=queues, stop_event=stop_event)
