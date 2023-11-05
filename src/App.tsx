import Chat from "./Chat.tsx";
import Settings from "./Settings.tsx";
import SettingsContextProvider from "./SettingsContext.tsx";

export default function App() {
  return (
    <SettingsContextProvider>
      <div className="grid cols-1 lg:cols-2-1 h-100 w-100">
        <Chat />
        <Settings />
      </div>
    </SettingsContextProvider>
  );
}
