import Chat from "./Chat.tsx";
import Settings from "./Settings.tsx";
import SettingsContextProvider from "./SettingsContext.tsx";

export default function App() {
  return (
    <SettingsContextProvider>
      <div className="grid cols-2 h-100">
        <Settings />
        <Chat />
      </div>
    </SettingsContextProvider>
  );
}
