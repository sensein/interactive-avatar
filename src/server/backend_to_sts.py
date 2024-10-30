import threading
import queue
from components.recv_client import recv_client
from components.send_sts import send_sts

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

    recv_client_thread = threading.Thread(target=recv_client, args=("localhost", 5001, queues, stop_event))
    # send_sts_thread = threading.Thread(target=send_sts, args=("localhost", 12345, queues, stop_event))
    

    # threads.extend([recv_client_thread, send_sts_thread])
    threads.extend([recv_client_thread])

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
