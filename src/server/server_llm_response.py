from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from datetime import datetime
from speech_to_speech import process_audio

app = Flask(__name__)
CORS(app)  # Enable CORS
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the uploads folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Route to handle audio uploads and processing
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save the uploaded file
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d%H%M%S')}.wav")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Process the saved audio file using the Speech-to-Speech library
        try:
            # Assume process_audio takes the file path and returns a result
            result = process_audio(file_path)

            # Return the processed result to the frontend
            return jsonify({'result': result}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

# Serve uploaded files statically
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(port=5001)
