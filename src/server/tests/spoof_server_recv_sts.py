import socket
import threading
from queue import Queue
import sounddevice as sd
import struct
import pickle
from typing import Optional, Dict, Callable, Union, List
import numpy as np

def spoof_server_recv_sts(
    recv_rate: int = 44100,
    list_play_chunk_size: int = 512,
    host: str = "localhost",
    recv_port: int = 12346,
) -> None:
    recv_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    recv_socket.connect((host, recv_port))

    print("Recording and streaming...")

    stop_event: threading.Event = threading.Event()
    recv_queue_text: Queue[str] = Queue()
    recv_queue_visemes: Queue[List[Dict[str, Union[str, float]]]] = Queue()
    recv_queue_audio: Queue[bytes] = Queue()

    # This callback is specifically for the sd audio player
    def callback_recv(
        outdata: bytearray,
        frames: int,
        time: Callable,
        status: sd.CallbackFlags,
    ) -> None:
        if not recv_queue_audio.empty():
            data: bytes = recv_queue_audio.get()
            outdata[: len(data)] = data
            outdata[len(data) :] = b"\x00" * (len(outdata) - len(data))
        else:
            outdata[:] = b"\x00" * len(outdata)

    # Process a received packet
    def recv(
        stop_event: threading.Event,
        recv_queue_text: Queue[str],
        recv_queue_visemes: Queue[List[Dict[str, Union[str, float]]]],
        recv_queue_audio: Queue[bytes],
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
                # Step 4: Deserialize the packet using pickle
                packet: Dict[str, Union[str, List[Dict[str, Union[str, float]]], np.ndarray]] = pickle.loads(serialized_packet)

                # Step 5: Extract the packet contents
                if 'text' in packet:
                    text: str = packet['text']
                    recv_queue_text.put(text)
                    print(text)
                    print("TEXT")
                if 'visemes' in packet:
                    visemes: List[Dict[str, Union[str, float]]] = packet['visemes']
                    recv_queue_visemes.put(visemes)
                    print(visemes)
                    print("VISEMES")
                if 'audio' in packet:
                    # Step 6: Put the packet audio data into the queue for sending
                    audio: np.ndarray = packet['audio']
                    audio: bytes = audio.tobytes()
                    recv_queue_audio.put(audio)
                    print("AUDIO")

    try:
        recv_stream = sd.RawOutputStream(
            samplerate=recv_rate,
            channels=1,
            dtype="int16",
            blocksize=list_play_chunk_size,
            callback=callback_recv,
        )
        threading.Thread(target=recv_stream.start).start()

        recv_thread = threading.Thread(target=recv, args=(stop_event, recv_queue_text, recv_queue_visemes, recv_queue_audio))
        recv_thread.start()

        input("Press Enter to stop...")

    except KeyboardInterrupt:
        print("Finished streaming.")

    finally:
        stop_event.set()
        recv_thread.join()
        recv_socket.close()
        print("Connection closed.")


if __name__ == "__main__":
    spoof_server_recv_sts()