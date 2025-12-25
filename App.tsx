
import { AuthProvider } from './src/contexts/AuthContext';
import { StoryProvider } from './src/contexts/StoryContext';
import { CartProvider } from './src/contexts/CartContext';
import { AppRouter } from './src/AppRouter';
import { ChatBot } from './components/ChatBot';

console.log("🏁 App.tsx module loaded!");

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoryProvider>
        <CartProvider>
          <AppRouter />
          <ChatBot />
        </CartProvider>
      </StoryProvider>
    </AuthProvider>
  );
};

export default App;
