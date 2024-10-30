import threading
from queue import Queue
from server.tests.recv_sts import recv_sts
from server.tests.send_client_text import send_client

def sts_to_client():
    stop_event = threading.Event()
    text_queue = Queue()
    visemes_queue = Queue()
    audio_queue = Queue()

    # Setup threads
    recv_sts_thread = threading.Thread(
        target=recv_sts,
        kwargs={
            'stop_event': stop_event,
            'recv_queue_text': text_queue,
            'recv_queue_visemes': visemes_queue,
            'recv_queue_audio': audio_queue,
            'host': 'localhost',
            'port': 12346,
        },
    )
    send_client_thread = threading.Thread(
        target=send_client,
        kwargs={
            'text_queue': text_queue,
            'visemes_queue': visemes_queue,
            'audio_queue': audio_queue,
            'host': 'localhost',
            'port': 5002,
        },
    )

    # Start servers
    recv_sts_thread.start()
    send_client_thread.start()


if __name__ == '__main__':
    sts_to_client()
