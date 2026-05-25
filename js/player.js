/**
 * Player Module
 * Handles sequential playback, looping, pause/resume of sentences
 */
const Player = (() => {
    let sentences = [];
    let currentIndex = -1;
    let isPlaying = false;
    let isPaused = false;
    let loopMode = 'none'; // 'none', 'all', 'single'
    let onStateChange = null;

    function setSentences(data) {
        sentences = data;
        currentIndex = -1;
    }

    function setLoopMode(mode) {
        loopMode = mode;
        notifyStateChange();
    }

    function getLoopMode() {
        return loopMode;
    }

    function play(startIndex = 0) {
        if (sentences.length === 0) return;
        isPlaying = true;
        isPaused = false;
        currentIndex = startIndex;
        speakCurrent();
        notifyStateChange();
    }

    function pause() {
        if (!isPlaying) return;
        isPaused = true;
        TTS.stop();
        notifyStateChange();
    }

    function resume() {
        if (!isPaused) return;
        isPaused = false;
        speakCurrent();
        notifyStateChange();
    }

    function stop() {
        isPlaying = false;
        isPaused = false;
        TTS.stop();
        currentIndex = -1;
        notifyStateChange();
    }

    function speakCurrent() {
        if (currentIndex < 0 || currentIndex >= sentences.length) return;
        if (!isPlaying || isPaused) return;

        const sentence = sentences[currentIndex];
        highlightSentence(currentIndex);

        TTS.speak(sentence.en, 'en-US', () => {
            if (!isPlaying || isPaused) return;
            onSentenceEnd();
        });
    }

    function onSentenceEnd() {
        if (loopMode === 'single') {
            speakCurrent();
        } else {
            currentIndex++;
            if (currentIndex >= sentences.length) {
                if (loopMode === 'all') {
                    currentIndex = 0;
                    speakCurrent();
                } else {
                    stop();
                }
            } else {
                speakCurrent();
            }
        }
        notifyStateChange();
    }

    function highlightSentence(index) {
        document.querySelectorAll('.sentence-item').forEach((el, i) => {
            el.classList.toggle('playing', i === index);
        });
    }

    function getState() {
        return { isPlaying, isPaused, currentIndex, loopMode, total: sentences.length };
    }

    function setOnStateChange(cb) {
        onStateChange = cb;
    }

    function notifyStateChange() {
        if (onStateChange) onStateChange(getState());
    }

    return {
        setSentences, setLoopMode, getLoopMode,
        play, pause, resume, stop,
        getState, setOnStateChange
    };
})();
