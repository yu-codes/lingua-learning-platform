/**
 * TTS (Text-to-Speech) Module
 * Uses Web Speech API for pronunciation
 * Includes workaround for Chrome cancel/speak race condition
 */
const TTS = (() => {
    let currentUtterance = null;
    let isSpeaking = false;
    let speakTimeout = null;

    function speak(text, lang = 'en-US', onEnd = null) {
        // Clear any pending speak
        if (speakTimeout) {
            clearTimeout(speakTimeout);
            speakTimeout = null;
        }

        // Detach callbacks from current utterance before cancel
        if (currentUtterance) {
            currentUtterance.onend = null;
            currentUtterance.onerror = null;
        }

        // Cancel current speech
        speechSynthesis.cancel();
        isSpeaking = false;
        currentUtterance = null;

        // Small delay to let cancel() fully settle (Chrome bug workaround)
        speakTimeout = setTimeout(() => {
            speakTimeout = null;
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
            utterance.onerror = (e) => {
                // 'interrupted' is expected when cancel() is called
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    isSpeaking = false;
                    currentUtterance = null;
                    return;
                }
                isSpeaking = false;
                currentUtterance = null;
                if (onEnd) onEnd();
            };

            currentUtterance = utterance;
            speechSynthesis.speak(utterance);
        }, 50);
    }

    function stop() {
        if (speakTimeout) {
            clearTimeout(speakTimeout);
            speakTimeout = null;
        }
        if (currentUtterance) {
            currentUtterance.onend = null;
            currentUtterance.onerror = null;
        }
        speechSynthesis.cancel();
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
