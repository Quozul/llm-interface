import { useContext, useState } from "react";
import { SettingsContext } from "../SettingsContext.tsx";

type HistoryEntry = {
  name: string;
  message: string;
  timestamp: Date;
  error?: boolean;
};

export default function useHistory(latestContent: string | null) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { chatHistoryTemplate, chatbotName } = useContext(SettingsContext);

  const latest: HistoryEntry | null =
    latestContent === null
      ? null
      : {
          name: chatbotName,
          timestamp: new Date(),
          message: latestContent,
        };

  function addToHistory(
    author: string,
    content: string,
    error: boolean = false,
  ) {
    const newMessage = {
      name: author,
      message: content,
      timestamp: new Date(),
      error,
    };

    setHistory((prevState) => [...prevState, newMessage]);

    const completeHistory: HistoryEntry[] = [...history, newMessage];

    return completeHistory
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(({ name, message }) =>
        chatHistoryTemplate
          .replace("{{name}}", name)
          .replace("{{message}}", message),
      )
      .join("\n");
  }

  function clearHistory() {
    setHistory([]);
  }

  const completeHistory: HistoryEntry[] =
    latest === null ? history : [...history, latest];

  return {
    addToHistory,
    completeHistory: completeHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    ),
    clearHistory,
  };
}
