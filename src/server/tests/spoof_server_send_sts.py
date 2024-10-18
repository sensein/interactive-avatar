import socket
import threading
from queue import Queue
import sounddevice as sd
from typing import Callable

def spoof_server_send_sts(
    send_rate: int = 16000,
    list_play_chunk_size: int = 512,
    host: str = "localhost",
    send_port: int = 12345,
) -> None:
    send_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.connect((host, send_port))

    print("Recording and streaming...")

    stop_event: threading.Event = threading.Event()
    send_queue: Queue[bytes] = Queue()

    def callback_send(
        indata: bytearray,
        frames: int,
        time: Callable,
        status: sd.CallbackFlags,
    ) -> None:
        data: bytes = bytes(indata)
        send_queue.put(data)

    def send(
        stop_event: threading.Event,
        send_queue: Queue[bytes],
    ) -> None:
        while not stop_event.is_set():
            data = send_queue.get()
            send_socket.sendall(data)

    try:
        send_stream = sd.RawInputStream(
            samplerate=send_rate,
            channels=1,
            dtype="int16",
            blocksize=list_play_chunk_size,
            callback=callback_send,
        )
        threading.Thread(target=send_stream.start).start()

        send_thread = threading.Thread(target=send, args=(stop_event, send_queue))
        send_thread.start()

        input("Press Enter to stop...")

    except KeyboardInterrupt:
        print("Finished streaming.")

    finally:
        stop_event.set()
        send_thread.join()
        send_socket.close()
        print("Connection closed.")


if __name__ == "__main__":
    spoof_server_send_sts()