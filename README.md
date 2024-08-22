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

## Contributing

We welcome contributions! Please send us an email at [fabiocat@mit.edu](mailto:fabiocat@mit.edu) if you're interested in contributing to the project. We will get in touch to discuss your ideas and provide access.

### Action Plan

Check out our [project board](https://github.com/orgs/sensein/projects/48/views/1) for the current roadmap and ongoing tasks.

## License

This project is licensed under the Apache 2.0 license.