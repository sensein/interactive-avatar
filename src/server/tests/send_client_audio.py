from typing import Callable, List, Dict
import sounddevice as sd
import asyncio
import websockets
import queue
import threading
import json
import base64

def send_client_text(
    stop_event: threading.Event,
    audio_queue: queue.Queue,
    host: str = "localhost",
    port: int = 5003,
):
    async def _send(websocket):
        print("send_client: Connected to WebSocket client.")
        try:
            while not stop_event.is_set():
                if not audio_queue.empty():
                    audio: bytes = audio_queue.get()
                    await websocket.send(audio)
                else:
                    await asyncio.sleep(0.001)  # Small delay to prevent high CPU usage if all queues are empty

        except websockets.ConnectionClosed:
            print("Client disconnected.")
        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            print("Streaming complete or connection closed.")

    async def start_server():
        print(f"WebSocket server running on ws://{host}:{port}")
        async with websockets.serve(_send, host, port):
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
    sample_rate = 44100
    chunk_size = 512
    host = "localhost"
    port = 5003

    # Setup server
    threading.Thread(
        target=send_client_text,
        kwargs={
            'stop_event': stop_event,
            'audio_queue': audio_queue,
            'host': host,
            'port': port
        }
    ).start()
    print("WebSocket server started...")

    # Audio callback
    def callback_send(
        indata: bytearray,
        frames: int,
        time: Callable,
        status: sd.CallbackFlags
    ) -> None:
        data = bytes(indata)
        print(f"Received audio chunk of {len(data)} bytes")  # Should be 1024 bytes if dtype=int16 and chunk_size=512
        audio_queue.put(data)

    # Play audio
    send_stream = sd.RawInputStream(
        samplerate=sample_rate,
        channels=1,
        dtype="float32",
        blocksize=chunk_size,
        callback=callback_send,
    )

    # Start capturing audio and streaming to WebSocket clients
    with send_stream:
        print("Capturing and streaming audio. Press Ctrl+C to stop.")
        threading.Event().wait()  # Keep the main thread alive for continuous streaming
