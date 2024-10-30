from typing import Callable
import sounddevice as sd
import asyncio
import websockets
import queue
import threading
import numpy as np

def recv_client(
    stop_event: threading.Event,
    audio_queue: queue.Queue,
    host: str = "localhost",
    port: int = 5001,
):
    async def _recv(websocket):
        print("Connected to WebSocket client.")
        try:
            async for message in websocket:
                # Convert incoming int16 audio message to numpy array
                audio_chunk = np.frombuffer(message, dtype=np.int16).tobytes()
                print(f"Received audio chunk of size: {len(audio_chunk)}")
                audio_queue.put(audio_chunk)
        except websockets.ConnectionClosed:
            print("Connection to WebSocket client closed.")
        except Exception as e:
            print(f"An error occurred: {e}")

    async def start_server():
        print(f"WebSocket server running on ws://{host}:{port}")
        async with websockets.serve(_recv, host, port):
            await asyncio.Future()  # Run until stopped

    # Start the WebSocket server
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server_task = loop.create_task(start_server())
    try:
        loop.run_forever()
    finally:
        server_task.cancel()
        loop.run_until_complete(server_task)
        loop.close()


if __name__ == "__main__":
    stop_event = threading.Event()
    audio_queue = queue.Queue()
    sample_rate = 16000
    chunk_size = 512
    host = "localhost"
    port = 5001

    # Setup server
    threading.Thread(
        target=recv_client,
        kwargs={
            'stop_event': stop_event,
            'audio_queue': audio_queue,
            'host': host,
            'port': port
        }
    ).start()
    print("WebSocket server started...")

    # Audio callback
    def callback_recv(
        outdata: bytearray,
        frames: int,
        time: Callable,
        status: sd.CallbackFlags,
    ) -> None:
        if not audio_queue.empty():
            data = audio_queue.get()  # Ensure data is in bytes format
            
            # Fill outdata with data, and pad with zeros if data is shorter than outdata
            if len(data) < len(outdata):
                outdata[:len(data)] = data  # Fill with data
                outdata[len(data):] = b"\x00" * (len(outdata) - len(data))  # Pad with zeros
            else:
                outdata[:] = data[:len(outdata)]  # Trim data if it's too long
        else:
            outdata[:] = b"\x00" * len(outdata)  # Fill with silence if no data available

    # Play audio
    recv_stream = sd.RawOutputStream(
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
        blocksize=chunk_size,
        callback=callback_recv
    )

    # Start capturing audio and streaming to WebSocket clients
    with recv_stream:
        print("Capturing and streaming audio. Press Ctrl+C to stop.")
        threading.Event().wait()  # Keep the main thread alive for continuous streaming
