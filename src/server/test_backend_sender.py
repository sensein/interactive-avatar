import threading
from queue import Queue
from STS.connections.socket_sender import SocketSender
from threading import Event

def test(queue_in):
    sample_data = {
        'audio': b'This is test audio data',
        'text': 'This is a test message',
        'visemes': ['v1', 'v2', 'v3'],
    }

    queue_in.put(sample_data)
    print("Sent sample_data")

    queue_in.put({'audio': b"END"})
    print("Sent end signal")

def main():
    try:
        stop_event = Event()
        queue_in = Queue()
        sender = SocketSender(
            stop_event=stop_event,
            queue_in=queue_in,
            host="localhost",
            port=12346
        )
        sender_thread = threading.Thread(target=sender.run)
        sender_thread.start()

        while True:
            input("Press enter to send data...\n")
            test(queue_in)
    
    except KeyboardInterrupt:
        stop_event.set()
        sender_thread.join()

if __name__ == "__main__":
    main()
