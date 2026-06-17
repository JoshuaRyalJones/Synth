const audioCtx = new AudioContext();

export const getAudioContext = () => {
    return audioCtx;
}

export const resumeAudio = () => {
    if (audioCtx.state === "suspended") {
        return audioCtx.resume();
    }
}
