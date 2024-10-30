# NextGen Project: LLM-Powered Educational Avatar

This repository contains the code for the NextGen Project, which aims to build and validate an interactive avatar controlled by a large language model (LLM) for educational purposes. The avatar offers various educational activities, including some designed to enhance vocabulary in children.

## Project Overview (dedicated website coming soon!!)

Vocabulary knowledge is the single best predictor of reading achievement and school completion. Socioeconomic gaps in vocabulary knowledge are well documented, and current approaches implemented in schools have failed to close these gaps. Our project evaluates the usability and effectiveness of a speech-based LLM-empowered conversational tutor designed to enhance vocabulary in children interactively and personalized. The tutor engages children with read-aloud digital books, explicit teaching, and word meaning evaluation.

## Setup

### Prerequisites

- Docker
- ...

### Installation 
(@micheal: how about creating a docker file orchestrating the entire setup?)

1. Clone the repository and the submodules:
    ```bash
    git clone --recurse-submodules https://github.com/sensein/interactive-avatar.git
    ```

2. Install dependencies of the server:
    ```bash
    cd src/server
    npm install
    ```

3. Install dependencies of the client:
    ```bash
    cd src/client
    npm install

4. ...

## Getting Started

1. Start the server:
    ```bash
    cd src/server
    node index.js
    ```

2. Start the client:
    ```bash
    cd src/client
    npm start
    ```

3. Access the application:
    Open your browser and go to `http://localhost:3000`.

4. Use the interface in the browser. Every audio ...

## Unit Testing Connections

To verify that your socket connections are properly configured for efficient and correct data transfer, you can run the following tests in pairs of terminals.

Navigate to `src/server/tests` in two seperate terminals.  You can test the code in the following ways:

### 1. Testing STS Receiving Data and the Server Sending Data
- **Terminal 1**: Run the STS receiver script
  ```
  python spoof_sts_recv_sts.py
  ```
- **Terminal 2**: Run the server sender script
  ```
  python spoof_server_send.py
  ```

### 2. Testing the Server Receiving Data and STS Sending Data
- **Terminal 1**: Run the server receiver script
  ```
  python spoof_server_recv_sts.py
  ```
- **Terminal 2**: Run the STS sender script
  ```
  python spoof_sts_send.py
  ```

Navigate one terminal to `src/server/tests` (for python commands) and the other to `src/client/tests` (for npm commands).

### 3. Testing the Server Receiving Data and the Client Sending Data

- **Terminal 1**: Run the server receiver script
  ```
  python spoof_server_recv_client.py
  ```
- **Terminal 2**: Run the client sender script
  ```
  npm run start:spoof_client_send
  ```

### 4. Testing the Client Receiving Data and the Server Sending Data
- **Terminal 1**: Run the client receiver script
  ```
  npm run start:spoof_client_recv
  ```
- **Terminal 2**: Run the server sender script
  ```
  python spoof_server_send_client.py
  ```

These tests are designed to ensure that your socket connections are properly set up to facilitate the accurate and efficient transfer of data between the different components.

## Contributing

We welcome contributions! Please send us an email at [fabiocat@mit.edu](mailto:fabiocat@mit.edu) if you're interested in contributing to the project. We will get in touch to discuss your ideas and provide access.

### Action Plan

Check out our [project board](https://github.com/orgs/sensein/projects/48/views/1) for the current roadmap and ongoing tasks.

## License

This project is licensed under the Apache 2.0 license.