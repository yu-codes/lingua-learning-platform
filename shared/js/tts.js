/**
 * TTS (Text-to-Speech) Module
 * Uses Web Speech API for pronunciation
 */
const TTS = (() => {
    let currentUtterance = null;
    let isSpeaking = false;

    function speak(text, lang = 'en-US', onEnd = null) {
        stop();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => { isSpeaking = true; };
        utterance.onend = () => {
            isSpeaking = false;
            currentUtterance = null;
            if (onEnd) onEnd();
        };
        utterance.onerror = () => {
            isSpeaking = false;
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        currentUtterance = utterance;
        speechSynthesis.speak(utterance);
    }

    function stop() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        isSpeaking = false;
        currentUtterance = null;
    }

    function pause() {
        if (speechSynthesis.speaking) {
            speechSynthesis.pause();
        }
    }

    function resume() {
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
    }

    function getIsSpeaking() {
        return isSpeaking;
    }

    return { speak, stop, pause, resume, getIsSpeaking };
})();
