import sys
sys.path.append('..')
import threading
import queue
import time
from STS.connections.socket_receiver import SocketReceiver
from STS.connections.socket_sender import SocketSender

class SpoofSTSRecv:
    def __init__(self):
        self.stop_event = threading.Event()
        self.queue_out = queue.Queue()
        self.queue_in = queue.Queue()
        self.should_listen = threading.Event()

        self.receiver = SocketReceiver(
            stop_event=self.stop_event,
            queue_out=self.queue_out,
            should_listen=self.should_listen,
            host="127.0.0.1",
            port=12345,
            chunk_size=1024,
        )

        self.sender = SocketSender(
            stop_event=self.stop_event,
            queue_in=self.queue_in,
            host="127.0.0.1",
            port=12346,
        )

    def spoof_recv(self):
        while not self.stop_event.is_set():
            # input("Press Enter to recv data...\n")
            
            if not self.queue_out.empty():
                audio_chunk = self.queue_out.get()
                if audio_chunk == b"END":
                    print("Connection closed by sender.")
                    break
                # Print received audio chunk information
                print(f"Received Audio Chunk: {audio_chunk[:10]}... (showing first 10 bytes)")

    def run(self):
        receiver_thread = threading.Thread(target=self.receiver.run, daemon=True)
        sender_thread = threading.Thread(target=self.sender.run, daemon=True)
        spoof_recv_thread = threading.Thread(target=self.spoof_recv, daemon=True)

        receiver_thread.start()
        sender_thread.start()
        spoof_recv_thread.start()

        try:
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            self.stop_event.set()
            receiver_thread.join()
            spoof_recv_thread.join()
            sender_thread.join()

if __name__ == "__main__":
    spoofer = SpoofSTSRecv()
    spoofer.run()
