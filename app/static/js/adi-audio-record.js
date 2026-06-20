const button = document.getElementById("record-button");
const timer = document.getElementById("record-time");
const recordText = document.getElementById("record-text");
const recordIcon = document.getElementById("record-icon");
const stopIcon = document.getElementById("stop-icon");

let recorder;
let chunks = [];
let timerInterval;
let seconds = 0;
let recordingCount = 0;

const MAX_TIME = 10;

function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2 + 44;

    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);

    let offset = 0;

    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset++, str.charCodeAt(i));
        }
    }

    function writeUint32(value) {
        view.setUint32(offset, value, true);
        offset += 4;
    }

    function writeUint16(value) {
        view.setUint16(offset, value, true);
        offset += 2;
    }


    writeString("RIFF");
    writeUint32(length - 8);
    writeString("WAVE");

    writeString("fmt ");
    writeUint32(16);
    writeUint16(1);
    writeUint16(numChannels);
    writeUint32(sampleRate);
    writeUint32(sampleRate * numChannels * 2);
    writeUint16(numChannels * 2);
    writeUint16(16);

    writeString("data");
    writeUint32(buffer.length * numChannels * 2);

    const channels = [];

    for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {

            let sample = channels[channel][i];

            sample = Math.max(-1, Math.min(1, sample));

            view.setInt16(
                offset,
                sample < 0 ? sample * 0x8000 : sample * 0x7FFF,
                true
            );

            offset += 2;
        }
    }

    return new Blob(
        [arrayBuffer],
        { type: "audio/wav" }
    );
}

button.onclick = async () => {

    if (!recorder || recorder.state === "inactive") {
        startRecording();
    } else {
        stopRecording();
    }

};

function setRecordingState(isRecording) {
    recordText.textContent = isRecording ? "Stop Recording" : "Start Recording";
    recordIcon.classList.toggle("hidden", isRecording);
    stopIcon.classList.toggle("hidden", !isRecording);
    button.classList.toggle("recording", isRecording);
}

async function startRecording() {

    if (selectedFiles.length >= 2) {
        alert(MAX_FILES_ALERT);
        return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({audio: true});

    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => {
        chunks.push(e.data);
    };

    recorder.onstop = async () => {

        recordingCount++;

        const webmBlob = new Blob(chunks);
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const wavBlob = audioBufferToWav(audioBuffer);
        const file = new File(
            [wavBlob],
            `recording-${recordingCount}.wav`,
            { type: "audio/wav" }
        );

        addFiles([file]);
    };

    recorder.start();
    setRecordingState(true);
    seconds = 0;

    timerInterval = setInterval(() => {
        seconds++;
        timer.textContent = `00:${String(seconds).padStart(2,"0")} / 00:10`;
        if (seconds >= MAX_TIME) {
            stopRecording();
        }
    }, 1000);
}

function stopRecording() {

    recorder.stop();
    setRecordingState(false);
    clearInterval(timerInterval);
    timer.textContent = "00:00 / 00:10";

    recorder.stream.getTracks().forEach(track => track.stop());
}
