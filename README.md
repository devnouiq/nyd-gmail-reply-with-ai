# Gmail AI Auto Responder Chrome Extension

A professional Chrome extension that automatically responds to Gmail emails using AI and handles booking slot requests with intelligent scheduling capabilities.

## 🚀 Features

### 🤖 AI-Powered Email Responses
- **OpenAI Integration**: Uses GPT-4 for intelligent email responses
- **Context-Aware**: Analyzes email content to generate relevant replies
- **Customizable Styles**: Professional, friendly, casual, or formal response tones
- **Confidence Scoring**: Shows AI confidence level for each response

### 📅 Smart Booking Management
- **Automatic Detection**: Identifies booking requests in emails
- **Slot Suggestions**: Shows available time slots
- **API Integration**: Connects with external booking systems
- **Mock System**: Built-in mock booking for testing

### 🎨 Professional Design
- **Modern UI**: Clean, intuitive interface with gradient themes
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions and interactions
- **Accessibility**: Screen reader friendly with proper ARIA labels

### ⚙️ Advanced Configuration
- **Comprehensive Settings**: Full control over AI and booking behavior
- **Real-time Testing**: Test AI connections and booking APIs
- **Statistics Tracking**: Monitor daily activity and performance
- **Debug Mode**: Detailed logging for troubleshooting

## 📁 Project Structure

\`\`\`
gmail-ai-responder-extension/
├── manifest.json                 # Extension manifest
├── package.json                  # Node.js dependencies
├── tsconfig.json                # TypeScript configuration
├── README.md                    # Project documentation
├── src/                         # Source code
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                   # Utility functions
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── background/              # Background service worker
│   │   └── background.ts
│   ├── content/                 # Content scripts for Gmail
│   │   ├── content.ts
│   │   ├── content.css
│   │   └── ui-manager.ts
│   ├── popup/                   # Extension popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── options/                 # Settings page
│       ├── options.html
│       ├── options.css
│       └── options.ts
├── dist/                        # Compiled JavaScript (generated)
└── assets/                      # Static assets
    └── icons/                   # Extension icons
\`\`\`

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Chrome browser
- OpenAI API key (for AI responses)
- Booking API endpoint (optional)

### Development Setup

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd gmail-ai-responder-extension
   npm install
   \`\`\`

2. **Build the Extension**
   \`\`\`bash
   npm run build
   \`\`\`

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

4. **Configure Settings**
   - Click the extension icon and go to Settings
   - Add your OpenAI API key
   - Configure response preferences
   - Enable auto-reply

### Production Build

\`\`\`bash
npm run build
npm run lint
npm run format
\`\`\`

## 🔧 Configuration

### AI Settings
- **API Key**: Your OpenAI API key (required for AI responses)
- **Response Style**: Professional, friendly, casual, or formal
- **Response Length**: Short, medium, or long responses
- **Template**: Fallback response when AI is unavailable

### Booking Settings
- **API URL**: Your booking system endpoint
- **Default Duration**: Meeting length in minutes
- **Enable Booking**: Toggle booking functionality

### Advanced Options
- **Processing Delay**: Time before processing emails
- **Debug Mode**: Enable detailed logging
- **Notifications**: Show success/error messages

## 🔌 API Integration

### OpenAI API
The extension uses OpenAI's GPT-4 model for generating responses:

\`\`\`typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300
  })
})
\`\`\`

### Booking API
Expected booking API endpoints:

\`\`\`typescript
// Get available slots
GET /api/slots?date=2024-01-15

// Book a slot
POST /api/book
{
  "slotId": "slot-123",
  "attendeeEmail": "user@example.com",
  "purpose": "Meeting request"
}
\`\`\`

## 🎯 Usage

### Basic Usage
1. **Enable Auto-Reply**: Toggle in the popup
2. **Open Gmail**: Navigate to mail.google.com
3. **Open an Email**: The extension automatically processes it
4. **Review Response**: AI-generated response appears in a widget
5. **Send or Copy**: Use the response or copy to clipboard

### Booking Workflow
1. **Email Detection**: Extension detects booking keywords
2. **Slot Display**: Shows available time slots
3. **Selection**: Click to select a preferred slot
4. **Booking**: Confirm to book the selected slot
5. **Confirmation**: Receive booking confirmation

### Manual Testing
- Use the "Test AI" button in the popup
- Check connection status in settings
- View daily statistics and activity

## 🔒 Privacy & Security

- **Local Storage**: Settings stored locally in Chrome
- **No Data Collection**: Extension doesn't collect personal data
- **API Security**: API keys encrypted in Chrome storage
- **Permissions**: Minimal required permissions only

## 🐛 Troubleshooting

### Common Issues

**AI Not Responding**
- Check API key validity
- Verify internet connection
- Test connection in settings

**Booking Not Working**
- Verify booking API URL
- Check API endpoint availability
- Enable booking in settings

**Extension Not Loading**
- Refresh Gmail page
- Reload extension in Chrome
- Check console for errors

### Debug Mode
Enable debug mode in settings for detailed logging:
- Background service logs
- Content script activity
- API request/response details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all code
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for functions

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and support:
- Check the troubleshooting section
- Review Chrome extension logs
- Open an issue on GitHub
- Contact support team

## 🔄 Version History

### v1.0.0
- Initial release
- AI-powered email responses
- Booking slot integration
- Professional UI design
- Comprehensive settings

---

**Built with ❤️ using TypeScript, Chrome Extensions API, and OpenAI**
