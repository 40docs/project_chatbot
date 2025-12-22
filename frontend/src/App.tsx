import { ChatProvider } from './context/ChatContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ChatContainer } from './components/chat/ChatContainer';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ChatProvider>
          <MainLayout>
            <ChatContainer />
          </MainLayout>
        </ChatProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
