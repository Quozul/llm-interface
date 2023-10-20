import { useContext, useState } from "react";
import { SettingsContext } from "../SettingsContext.tsx";

type HistoryEntry = {
  name: string;
  message: string;
};

export default function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const { chatHistoryTemplate } = useContext(SettingsContext);

  function addToHistory(author: string, content: string) {
    setHistory((prevState) => [
      ...prevState,
      { name: author, message: content },
    ]);
  }

  function setLatestMessage(author: string, content: string) {
    setLatest({ name: author, message: content });
  }

  function addLatestMessage() {
    if (latest !== null) {
      setHistory((prevState) => [...prevState, latest]);
      setLatest(null);
    }
  }

  const completeHistory: HistoryEntry[] =
    latest === null ? history : [...history, latest];

  const formattedHistory = completeHistory
    .map(({ name, message }) =>
      chatHistoryTemplate
        .replace("{{name}}", name)
        .replace("{{message}}", message),
    )
    .join("\n");

  return {
    addToHistory,
    formattedHistory,
    completeHistory,
    setLatestMessage,
    addLatestMessage,
  };
}
