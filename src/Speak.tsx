import { useCallback, useContext, useEffect, useState } from "react";
import { SettingsContext } from "./SettingsContext.tsx";

const synth = window.speechSynthesis;

export function speak(content: string, selectedVoice: SpeechSynthesisVoice) {
  if (synth.speaking) {
    console.error("speechSynthesis.speaking");
    return;
  }

  if (content !== "") {
    const utterThis = new SpeechSynthesisUtterance(content);

    utterThis.voice = selectedVoice;
    utterThis.pitch = 1;
    utterThis.rate = 1;
    synth.speak(utterThis);
  }
}

export function useVoices(selectedLanguage: string | null = null) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const onVoiceChanged = useCallback(() => {
    if (selectedLanguage === null) {
      setVoices(window.speechSynthesis.getVoices());
    } else {
      const voices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang === selectedLanguage);

      setVoices(voices);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    onVoiceChanged();
    window.speechSynthesis.addEventListener("voiceschanged", onVoiceChanged);

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        onVoiceChanged,
      );
    };
  }, [onVoiceChanged]);

  return voices;
}

export function useCurrentVoice() {
  const { selectedVoice } = useContext(SettingsContext);
  const voices = useVoices();

  if (selectedVoice === null) {
    return null;
  }

  for (let i = 0; i < voices.length; i++) {
    if (voices[i].name === selectedVoice) {
      return voices[i];
    }
  }

  return null;
}
