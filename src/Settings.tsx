import { useContext } from "react";
import { SettingsContext } from "./SettingsContext.tsx";
import TextArea from "./TextArea.tsx";

const TEMPLATES = {
  chat: {
    promptTemplate: "{{prompt}}\n\n{{history}}\n{{char}}: ",
    chatHistoryTemplate: "{{name}}: {{message}}",
    stop: (chatbotName: string, userName: string) => [
      "</s>",
      `${chatbotName}:`,
      `${userName}:`,
    ],
  },
  // ChatML format: https://github.com/openai/openai-python/blob/main/chatml.md
  chatml: {
    promptTemplate:
      "<|im_start|>system\n{{prompt}}<|im_end|>\n{{history}}\n<|im_start|>{{char}}\n",
    chatHistoryTemplate: "<|im_start|>{{name}}\n{{message}}<|im_end|>",
    stop: () => ["</s>", "<|im_start|>", "<|im_end|>"],
  },
  stable: {
    promptTemplate: "### System:\n{{prompt}}\n\n{{history}}\n### {{char}}:\n",
    chatHistoryTemplate: "### {{name}}:\n{{message}}\n",
    stop: (chatbotName: string, userName: string) => [
      "</s>",
      `### System:`,
      `### ${chatbotName}:`,
      `### ${userName}:`,
    ],
  },
};

export default function Settings() {
  const {
    chatbotName,
    setChatbotName,
    userName,
    setUserName,
    systemPrompt,
    setSystemPrompt,
    setChatHistoryTemplate,
    setPromptTemplate,
    llamaEndpoint,
    setLlamaEndpoint,
    setStop,
    promptTemplate,
    chatHistoryTemplate,
  } = useContext(SettingsContext);

  return (
    <div className="flex-col p-1 overflow-auto">
      <div className="flex-col bg-gray-300 p-2 rounded-1">
        <h2>General settings</h2>

        <label className="flex-col">
          Llama.cpp server endpoint
          <input
            value={llamaEndpoint}
            onInput={({ currentTarget }) => {
              setLlamaEndpoint(currentTarget.value);
            }}
          />
        </label>

        <label className="flex-col">
          Chatbot name
          <input
            value={chatbotName}
            onInput={({ currentTarget }) => {
              setChatbotName(currentTarget.value);
            }}
          />
        </label>

        <label className="flex-col">
          User name
          <input
            value={userName}
            onInput={({ currentTarget }) => {
              setUserName(currentTarget.value);
            }}
          />
        </label>

        <label className="flex-col">
          System prompt
          <TextArea
            value={systemPrompt}
            onInput={({ currentTarget }) => {
              setSystemPrompt(currentTarget.value);
            }}
          />
        </label>
      </div>

      <div className="flex-col bg-gray-300 p-2 rounded-1">
        <h2>Prompt template</h2>

        <div className="flex align-center">
          Presets:
          {Object.entries(TEMPLATES).map(
            ([
              key,
              { promptTemplate: newPromptTemplate, chatHistoryTemplate, stop },
            ]) => {
              return (
                <button
                  key={key}
                  className={
                    promptTemplate === newPromptTemplate ? "primary" : ""
                  }
                  onClick={() => {
                    setChatHistoryTemplate(chatHistoryTemplate);
                    setPromptTemplate(newPromptTemplate);
                    setStop(stop(chatbotName, userName));
                  }}
                >
                  {key}
                </button>
              );
            },
          )}
        </div>

        <label className="flex-col">
          Prompt settings
          <TextArea
            rows={5}
            value={promptTemplate}
            onInput={({ currentTarget }) => {
              setPromptTemplate(currentTarget.value);
            }}
          />
        </label>

        <label className="flex-col">
          Chat history template
          <TextArea
            rows={2}
            value={chatHistoryTemplate}
            onInput={({ currentTarget }) => {
              setChatHistoryTemplate(currentTarget.value);
            }}
          />
        </label>
      </div>
    </div>
  );
}
