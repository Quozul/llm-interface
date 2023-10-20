import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useState,
} from "react";
import { TEMPLATES } from "./Settings.tsx";

type ContextType = {
  chatbotName: string;
  userName: string;
  systemPrompt: string;
  promptTemplate: string;
  chatHistoryTemplate: string;
  llamaEndpoint: string;
  stop: string[];
  setChatbotName: Dispatch<SetStateAction<string>>;
  setUserName: Dispatch<SetStateAction<string>>;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  setPromptTemplate: Dispatch<SetStateAction<string>>;
  setChatHistoryTemplate: Dispatch<SetStateAction<string>>;
  setLlamaEndpoint: Dispatch<SetStateAction<string>>;
  setStop: Dispatch<SetStateAction<string[]>>;
};

const templateName = "zephyr";

const initialState = {
  llamaEndpoint: "http://localhost:8080",
  chatbotName: "Zephyr",
  userName: "User",
  systemPrompt:
    "You are Zephyr, an AI assistant. Answer as concisely as possible in the User's language. Markdown format allowed.",
  promptTemplate: TEMPLATES[templateName].promptTemplate,
  chatHistoryTemplate: TEMPLATES[templateName].chatHistoryTemplate,
  stop: TEMPLATES[templateName].stop,
  setChatbotName: () => void 0,
  setUserName: () => void 0,
  setSystemPrompt: () => void 0,
  setPromptTemplate: () => void 0,
  setChatHistoryTemplate: () => void 0,
  setLlamaEndpoint: () => void 0,
  setStop: () => void 0,
};

export const SettingsContext = createContext<ContextType>(initialState);

export default function SettingsContextProvider({
  children,
}: PropsWithChildren<{}>) {
  const [chatbotName, setChatbotName] = useState(initialState.chatbotName);
  const [userName, setUserName] = useState(initialState.userName);
  const [systemPrompt, setSystemPrompt] = useState(initialState.systemPrompt);
  const [llamaEndpoint, setLlamaEndpoint] = useState(
    initialState.llamaEndpoint,
  );
  const [stop, setStop] = useState(initialState.stop);
  const [promptTemplate, setPromptTemplate] = useState(
    initialState.promptTemplate,
  );
  const [chatHistoryTemplate, setChatHistoryTemplate] = useState(
    initialState.chatHistoryTemplate,
  );

  return (
    <SettingsContext.Provider
      value={{
        chatbotName,
        setChatbotName,
        userName,
        setUserName,
        systemPrompt,
        setSystemPrompt,
        promptTemplate,
        chatHistoryTemplate,
        setPromptTemplate,
        setChatHistoryTemplate,
        llamaEndpoint,
        setLlamaEndpoint,
        stop,
        setStop,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
