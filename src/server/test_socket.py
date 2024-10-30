import socket
import threading
import struct
import pickle
import time
import numpy as np  # Import NumPy to create a mock array

def start_server():
    recv_port = 12345  # This is where we'll receive data from `listen_and_play.py`
    send_port = 12346  # This is where we'll send data back to `listen_and_play.py`

    # Set up the recv socket (to receive data from listen_and_play.py)
    recv_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    recv_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    recv_socket.bind(('localhost', recv_port))
    recv_socket.listen(1)
    print(f"Listening for connection on recv_port: {recv_port}...")

    # Set up the send socket (to send data back to listen_and_play.py)
    send_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    send_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    send_socket.bind(('localhost', send_port))
    send_socket.listen(1)
    print(f"Listening for connection on send_port: {send_port}...")

    recv_conn = None
    send_conn = None

    # Accept connections in a loop to ensure both sockets are connected
    while recv_conn is None or send_conn is None:
        try:
            if recv_conn is None:
                recv_conn, _ = recv_socket.accept()
                print("Recv socket connected!")
        except BlockingIOError:
            pass

        try:
            if send_conn is None:
                send_conn, _ = send_socket.accept()
                print("Send socket connected!")
        except BlockingIOError:
            pass

        time.sleep(0.1)  # Small delay to avoid busy-waiting

    # Now both connections are established, proceed with data handling
    def send_data(conn):
        """ Sends dummy audio, text, and visemes data back to `listen_and_play.py` """
        while True:
            # Create a NumPy array to simulate audio data, which supports `.tobytes()`
            audio_data = np.array([1, 2, 3, 4], dtype=np.int16)  # Mock audio data

            # Create a sample packet of audio (as a NumPy array), text, and visemes data
            sample_packet = {
                'audio': audio_data,  # Send audio as a NumPy array
                'text': 'This is a test message from the server!',
                'visemes': ['v1', 'v2', 'v3']
            }

            # Serialize the packet using pickle
            serialized_packet = pickle.dumps(sample_packet)

            # Compute the length of the serialized packet and send the length first
            packet_length = len(serialized_packet)
            conn.sendall(struct.pack('!I', packet_length))

            # Now send the actual serialized packet
            conn.sendall(serialized_packet)

            print(f"Sent packet to client: {sample_packet}")

            # Sleep a bit before sending more data
            time.sleep(2)

    def receive_data(conn):
        """ Receives data from `listen_and_play.py` and sends a confirmation message back """
        def receive_full_chunk(conn, chunk_size):
            """ Helper function to receive exactly 'chunk_size' bytes """
            data = b""
            while len(data) < chunk_size:
                packet = conn.recv(chunk_size - len(data))
                if not packet:
                    return None  # Connection closed
                data += packet
            return data

        while True:
            try:
                # Receive the first 4 bytes to get the length of the incoming packet
                length_data = receive_full_chunk(conn, 4)
                if not length_data:
                    print("No data received, closing connection")
                    continue

                # Unpack the length (4 bytes)
                packet_length = struct.unpack('!I', length_data)[0]
                print(f"Expecting packet of length: {packet_length} bytes")

                # Skip empty packets (length 0)
                if packet_length == 0:
                    print("Received empty packet, skipping...")
                    continue

                # Receive the full packet based on the length
                serialized_packet = receive_full_chunk(conn, packet_length)
                if serialized_packet is None:
                    print("Connection closed while receiving packet")
                    continue

                print(f"Received packet of length: {len(serialized_packet)} bytes")

                # Deserialize the packet
                packet = pickle.loads(serialized_packet)

                # Print the received packet (audio, text, or visemes)
                if 'audio' in packet:
                    print("Received audio from client.")
                if 'text' in packet:
                    print(f"Received text from client: {packet['text']}")
                if 'visemes' in packet:
                    print(f"Received visemes from client: {packet['visemes']}")

                # Send confirmation back to `listen_and_play.py` that audio was received
                confirmation_packet = {
                    'text': 'Audio received successfully!',
                    'visemes': ['confirm_v1', 'confirm_v2']
                }

                # Serialize the confirmation packet
                serialized_confirmation_packet = pickle.dumps(confirmation_packet)

                # Send the length of the confirmation packet
                conn.sendall(struct.pack('!I', len(serialized_confirmation_packet)))

                # Send the actual confirmation packet
                conn.sendall(serialized_confirmation_packet)

                print("Sent confirmation packet to client.")
            except Exception as e:
                print(f"Error while receiving data: {e}")

    # Start receiving and sending data in parallel threads
    recv_thread = threading.Thread(target=receive_data, args=(recv_conn,))
    send_thread = threading.Thread(target=send_data, args=(send_conn,))
    recv_thread.start()
    send_thread.start()

    recv_thread.join()
    send_thread.join()

if __name__ == "__main__":
    start_server()
