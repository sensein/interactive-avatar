import React, { useState, useRef, useEffect } from 'react';
import FourPanels from '../components/FourPanels';
import AvatarCreateComponent from '../components/AvatarCreateComponent';
import AvatarRenderComponent from '../components/AvatarRenderComponent';
import RecordAndSend from '../components/connections/RecordAndSend';
import DisplayAndPlay from '../components/DisplayAndPlay';
import useReceiver from '../components/connections/useReceiver';
import TestRecvStream from '../tests/TestRecvStream';
import TestAudioPlayer from '../tests/TestAudioPlayer';
import ReceiverHandler from '../tests/ReceiverHandler';
import TextArea from '../components/TextArea';

const Main: React.FC = () => {
    const [transcription, setTranscription] = useState<string>("");
    const [visemesQueue, setVisemesQueue] = useState<any[]>([]);
    // const [audio, setAudio] = useState<any>();
    // const [audioQueue, setAudioQueue] = useState<Int16Array[]>([]);
    const [audioQueue, setAudioQueue] = useState<Float32Array[]>([]);
    // const { data, audioUrl, playAudio } = useReceiver({ host: "http://localhost", port: 5002 });
    // const { data, audioUrl, playAudio } = useReceiver({ host: "http://localhost", port: 12346 });

    const sendRate = 16000;
    const recvRate = 44100;
    const chunkSize = 512;

    useEffect(() => {
        console.log(transcription);
        console.log(visemesQueue);
    }, [transcription, visemesQueue]);

    return (
        <FourPanels
            // topLeft={<AvatarCreateComponent />}
            // topRight={<AvatarRenderComponent />}
            // topLeft={<></>}
            // topRight={<></>}
            topLeft={<TextArea text={transcription} />}
            topRight={<TextArea text={JSON.stringify(visemesQueue)} />}



            // bottomLeft={<></>}
            bottomLeft={<RecordAndSend host={`localhost`} port={5001} sampleRate={sendRate} chunkSize={chunkSize} />}
            // bottomRight={<DisplayAndPlay transcription={transcription} visemes={visemes} audioUrl={audio} playAudio={playAudio} />}
            // bottomRight={<TestRecvStream host={"ws://localhost"} port={5002} />}

            bottomRight={<ReceiverHandler
                setTranscription={setTranscription}
                setVisemesQueue={setVisemesQueue}
                setAudioQueue={setAudioQueue}
                audioQueue={audioQueue}
                // sampleRate={recvRate}
                host={`localhost`}
                port={5002}
            />}
            // bottomRight={<TestAudioPlayer />}
        />
    );
};

export default Main;
