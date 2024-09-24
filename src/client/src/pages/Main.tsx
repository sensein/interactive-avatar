import React, { useState } from 'react';
import FourPanels from '../components/FourPanels';
import AvatarCreateComponent from '../components/AvatarCreateComponent';
import AvatarRenderComponent from '../components/AvatarRenderComponent';
import SocketRecorderChunked from '../components/SocketRecorderChunked';
import TextArea from '../components/TextArea';

const Main: React.FC = () => {
    const [transcription, setTranscription] = useState<string | null>(null);
    const [visemes, setVisemes] = useState<any[]>([]);

    const handleTranscription = (text: string) => {
        setTranscription(text);
    };

    const handleVisemes = (visemeData: any[]) => {
        setVisemes(visemeData);
    };

    return (
        <FourPanels
            topLeft={<AvatarCreateComponent />}
            topRight={<AvatarRenderComponent />}
            bottomLeft={<SocketRecorderChunked onTranscription={handleTranscription} onVisemes={handleVisemes} />}
            bottomRight={<TextArea text={transcription}/>}
        />
    );
};

export default Main;
