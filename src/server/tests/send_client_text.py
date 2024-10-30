from typing import List, Dict
import sounddevice as sd
import asyncio
import websockets
import queue
import threading
import json

def send_client_text(
    stop_event: threading.Event,
    text_queue: queue.Queue,
    visemes_queue: queue.Queue,
    host: str = "localhost",
    port: int = 5002,
):
    async def _send(websocket):
        print("send_client: Connected to WebSocket client.")
        while not stop_event.is_set():
            data = {}

            if not text_queue.empty():
                text: str = text_queue.get()
                data = {
                    'type': 'text',
                    'data': text,
                }
            elif not visemes_queue.empty():
                visemes: List[Dict[str, int | float]] = visemes_queue.get()
                data = {
                    'type': 'visemes',
                    'data': visemes,
                }

            if data:
                print(f"Sending \"{data['type']}\" chunk of size: {len(data['data'])}")
                json_data = json.dumps(data)
                # encoded_json_data = json.dumps(data).encode('utf-8')
                await websocket.send(json_data)
            else:
                await asyncio.sleep(0.001)  # Small delay to prevent high CPU usage if all queues are empty

    # Start the WebSocket server
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = websockets.serve(_send, host, port)
    loop.run_until_complete(server)
    loop.run_forever()





if __name__ == "__main__":
    stop_event = threading.Event()
    text_queue = queue.Queue()
    visemes_queue = queue.Queue()
    sample_rate = 44100
    chunk_size = 512
    host = "localhost"
    port = 5002

    def add_data():
        while not stop_event.is_set():
            input("Press Enter to add data...")

            # Add text/visemes/audio
            text_queue.put("This is a spoofed text message.")
            visemes_queue.put(
                [
                    {'viseme': 1, 'timestamp': 0.1},
                    {'viseme': 2, 'timestamp': 0.2},
                    {'viseme': 3, 'timestamp': 0.3},
                ]
            )

    # Setup add_data
    threading.Thread(target=add_data, daemon=True).start()

    # Setup server
    send_client_text_thread = threading.Thread(
        target=send_client_text,
        kwargs={
            'stop_event': stop_event,
            'text_queue': text_queue,
            'visemes_queue': visemes_queue,
            'host': host,
            'port': port
        },
        daemon=True,
    )
    send_client_text_thread.start()
    print("WebSocket server started...")

    send_client_text_thread.join()
    while True:
        pass

    
