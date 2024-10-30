import socket
import threading
from queue import Queue
from dataclasses import dataclass, field
import sounddevice as sd
from transformers import HfArgumentParser
import struct

@dataclass
class ListenAndSendArguments:
    send_rate: int = field(
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
    send_port: int = field(
        default=12345,
        metadata={"help": "The network port for sending data. Default is 12345."},
    )


def listen_and_send(
    send_rate=16000,
    list_play_chunk_size=512,
    host="localhost",
    send_port=12345,
):
    send_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.connect((host, send_port))

    print("Recording and streaming...")

    stop_event = threading.Event()
    send_queue = Queue()

    def callback_send(indata, frames, time, status):
        """Callback to capture audio data and put it in the send queue."""
        data = bytes(indata)
        send_queue.put(data)

    def send(stop_event, send_queue):
        """Send data from the queue to the SocketReceiver."""
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

        # Start the send stream and thread
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
    parser = HfArgumentParser((ListenAndSendArguments,))
    (listen_and_send_kwargs,) = parser.parse_args_into_dataclasses()
    listen_and_send(**vars(listen_and_send_kwargs))
