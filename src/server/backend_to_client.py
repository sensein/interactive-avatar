import threading
import queue
from components.recv_sts import recv_sts
from components.send_client import send_client

def main():
    # Create shared queues for communication between components
    queues = {
        "audio": queue.Queue(),
        "text": queue.Queue(),
        "visemes": queue.Queue(),
    }
    stop_event = threading.Event()

    # Set up and run each component in a separate thread
    threads = []

    recv_sts_thread = threading.Thread(target=recv_sts, args=("localhost", 12346, queues, stop_event))
    send_client_thread = threading.Thread(target=send_client, args=("localhost", 5002, queues, stop_event))
    

    threads.extend([send_client_thread, recv_sts_thread])

    for thread in threads:
        thread.start()

    try:
        while True:
            pass
    except KeyboardInterrupt:
        stop_event.set()
        for thread in threads:
            thread.join()

if __name__ == "__main__":
    main()
