import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GymProvider } from './context/GymContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GymProvider>
        <App />
      </GymProvider>
    </BrowserRouter>
  </React.StrictMode>
);
