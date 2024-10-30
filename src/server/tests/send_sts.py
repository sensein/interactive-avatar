import socket
import threading
import queue
import sounddevice as sd
from typing import Callable

def send_sts(
    stop_event: threading.Event,
    audio_queue: queue.Queue,
    send_rate: int = 16000,
    chunk_size: int = 512,
    host: str = "localhost",
    port: int = 12345,
) -> None:
    send_socket: socket.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.connect((host, port))

    print("Recording and streaming...")

    stop_event: threading.Event = threading.Event()
    send_queue: queue.Queue[bytes] = queue.Queue()

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
        send_queue: queue.Queue[bytes],
    ) -> None:
        while not stop_event.is_set():
            data = send_queue.get()
            send_socket.sendall(data)

    try:
        send_stream = sd.RawInputStream(
            samplerate=send_rate,
            channels=1,
            dtype="int16",
            blocksize=chunk_size,
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
    send_sts()