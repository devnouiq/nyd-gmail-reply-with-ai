// Function to inject styles into the Gmail page
function injectStyles() {
  const styleElement = document.createElement('style')
  styleElement.textContent = `
      /* Styles for the in-page notification */
      #gmail-ai-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #1a73e8;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: "Google Sans", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif;
        animation: slideIn 0.3s ease-out;
      }
  
      #gmail-ai-notification:hover {
        background-color: #1557b0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
  
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `
  document.head.appendChild(styleElement)
}

// Export the function
export default injectStyles
