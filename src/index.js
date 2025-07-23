import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import store from './store';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { loadConfig } from './utils/config'; // Import the config loader

const root = ReactDOM.createRoot(document.getElementById('root'));

loadConfig()
  .then(() => {
    root.render(
      <React.StrictMode> {/* Added StrictMode */}
      <Provider store={store}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </Provider>
        </React.StrictMode>
    );
})
.catch((error) => {
    console.error("Failed to load config:", error);

    // Optional fallback render
    root.render(
      <div style={{ padding: '2rem', color: 'red' }}>
        Failed to load application configuration. Please try again later.
      </div>
    );
});
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
