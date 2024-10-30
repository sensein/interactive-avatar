import threading
from queue import Queue
from recv_client import recv_client
from send_sts import send_sts
from recv_sts import recv_sts
from server.tests.send_client_text import send_client

def client_to_sts():
    stop_event = threading.Event()
    audio_queue = Queue()

    # Setup servers
    recv_client_thread = threading.Thread(
        target=recv_client,
        kwargs={
            'stop_event': stop_event,
            'audio_queue': audio_queue,
            'host': 'localhost',
            'port': 5001,
        },
    )
    send_sts_thread = threading.Thread(
        target=send_sts,
        kwargs={
            'stop_event': stop_event,
            'audio_queue': audio_queue,
            'host': 'localhost',
            'port':12345,
        },
    )

    # Start servers
    recv_client_thread.start()
    send_sts_thread.start()
    print("Started client_to_sts server pipeline")

def sts_to_client():
    stop_event = threading.Event()
    text_queue = Queue()
    visemes_queue = Queue()
    audio_queue = Queue()

    # Setup servers
    recv_sts_thread = threading.Thread(
        target=recv_sts,
        kwargs={
            'stop_event': stop_event,
            'text_queue': text_queue,
            'visemes_queue': visemes_queue,
            'audio_queue': audio_queue,
            'host': 'localhost',
            'port': 12346,
        },
    )
    send_client_thread = threading.Thread(
        target=send_client,
        kwargs={
            'stop_event': stop_event,
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
    print("Started sts_to_client server pipeline")


if __name__ == '__main__':
    client_to_sts()
    sts_to_client()
