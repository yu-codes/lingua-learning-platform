/**
 * Player Module - English Thematic System
 * Handles sequential playback, looping, pause/resume
 * Supports selecting specific sentence for single loop
 */
const Player = (() => {
    let sentences = [];
    let currentIndex = -1;
    let isPlaying = false;
    let isPaused = false;
    let loopMode = 'none'; // 'none', 'all', 'single'
    let singleLoopIndex = -1; // which sentence to loop in single mode
    let onStateChange = null;

    function setSentences(data) {
        sentences = data;
        currentIndex = -1;
        singleLoopIndex = -1;
    }

    function setLoopMode(mode) {
        loopMode = mode;
        if (mode !== 'single') {
            singleLoopIndex = -1;
            clearLoopTargetHighlight();
        }
        notifyStateChange();
    }

    function getLoopMode() {
        return loopMode;
    }

    function setSingleLoopIndex(index) {
        singleLoopIndex = index;
        highlightLoopTarget(index);
        notifyStateChange();
    }

    function getSingleLoopIndex() {
        return singleLoopIndex;
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
        clearPlayingHighlight();
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
            // In single mode, loop the selected sentence
            const targetIdx = singleLoopIndex >= 0 ? singleLoopIndex : currentIndex;
            currentIndex = targetIdx;
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

    function clearPlayingHighlight() {
        document.querySelectorAll('.sentence-item').forEach(el => {
            el.classList.remove('playing');
        });
    }

    function highlightLoopTarget(index) {
        document.querySelectorAll('.sentence-item').forEach((el, i) => {
            el.classList.toggle('loop-target', i === index);
        });
        document.querySelectorAll('.sentence-loop-btn').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
    }

    function clearLoopTargetHighlight() {
        document.querySelectorAll('.sentence-item').forEach(el => {
            el.classList.remove('loop-target');
        });
        document.querySelectorAll('.sentence-loop-btn').forEach(el => {
            el.classList.remove('active');
        });
    }

    function getState() {
        return { isPlaying, isPaused, currentIndex, loopMode, singleLoopIndex, total: sentences.length };
    }

    function setOnStateChange(cb) {
        onStateChange = cb;
    }

    function notifyStateChange() {
        if (onStateChange) onStateChange(getState());
    }

    return {
        setSentences, setLoopMode, getLoopMode,
        setSingleLoopIndex, getSingleLoopIndex,
        play, pause, resume, stop,
        getState, setOnStateChange
    };
})();
