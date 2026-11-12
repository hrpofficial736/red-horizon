import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import LandingPage from './components/LandingPage/LandingPage.tsx';

createRoot(document.getElementById("root")!).render(<App />);
