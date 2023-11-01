import { useCallback, useContext, useEffect, useState } from "react";
import { speak, useCurrentVoice, useVoices } from "./Speak.tsx";
import { SettingsContext } from "./SettingsContext.tsx";

function useLanguages() {
  const [languages, setLanguages] = useState<string[]>([]);

  const onVoiceChanged = useCallback(() => {
    const availableLanguages = window.speechSynthesis
      .getVoices()
      .map(({ lang }) => lang)
      .reduce((acc: string[], cur) => {
        if (!acc.includes(cur)) {
          acc.push(cur);
        }
        return acc;
      }, []);

    setLanguages(availableLanguages);
  }, []);

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

  return languages;
}

export default function Voice() {
  const { setSelectedVoice } = useContext(SettingsContext);
  const [value, setValue] = useState("");
  const availableLanguages = useLanguages();
  const [selectedLanguage, setSelectedLanguage] = useState(
    availableLanguages?.[0] ?? "",
  );
  const voices = useVoices(selectedLanguage);
  const selectedVoice = useCurrentVoice();

  return (
    <form
      className="flex-col bg-gray-300 p-2 rounded-1"
      onSubmit={(event) => {
        event.preventDefault();

        if (selectedVoice !== null) {
          speak(value, selectedVoice);
        }
      }}
    >
      <h2>Voice settings</h2>

      <div className="flex">
        <label>
          Language
          <select
            onChange={({ currentTarget }) => {
              setSelectedLanguage(currentTarget.value);
            }}
          >
            {availableLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>

        {selectedLanguage && (
          <select
            onChange={({ currentTarget }) => {
              setSelectedVoice(currentTarget.value);
            }}
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {selectedVoice && (
        <>
          <h3>Selected voice</h3>
          <div className="list-group">
            <div className="list-entry">Name: {selectedVoice.name}</div>
            <div className="list-entry">Lang: {selectedVoice.lang}</div>
          </div>

          <input
            value={value}
            onInput={({ currentTarget }) => {
              setValue(currentTarget.value);
            }}
            defaultValue="Hello"
          />
          <button>Speak</button>
        </>
      )}
    </form>
  );
}
