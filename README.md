# تبيّن - Saudi Legal Assistant Chatbot

<div dir="rtl">

**تبيّن** هو مساعد قانوني ذكي يوفر معلومات حول الأنظمة واللوائح في المملكة العربية السعودية.

</div>

An intelligent legal assistant chatbot providing information about laws and regulations in Saudi Arabia, powered by Google Gemini AI with **fully offline voice capabilities**.

---

## 📊 Project Status

### ✅ Completed Features
- [x] Core chatbot functionality with Google Gemini AI integration
- [x] Multilingual support (Arabic, English, Hindi, Filipino)
- [x] Offline Speech-to-Text using Faster-Whisper
- [x] Text-to-Speech with gTTS
- [x] Interactive web interface with Flask
- [x] Sector-based navigation system
- [x] Voice input/output with microphone integration
- [x] Audio speed optimization (1.3x playback)
- [x] Base64 encoding for Unicode text in HTTP headers
- [x] Automatic language detection
- [x] Responsive chat UI with RTL/LTR support

### 🚧 In Progress
- [ ] Enhanced error handling for voice features
- [ ] Performance optimization for large audio files
- [ ] Caching system for TTS responses

### 📋 Planned Features
- [ ] User authentication system
- [ ] Chat history persistence
- [ ] Advanced legal document analysis
- [ ] Mobile application
- [ ] Offline mode for Gemini responses

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Core programming language |
| **Flask** | 3.0.0 | Web framework and API server |
| **Google Generative AI** | 0.3.2 | AI-powered chatbot responses |
| **Faster-Whisper** | 0.10.0 | Offline speech-to-text |
| **gTTS** | 2.5.1 | Text-to-speech generation |
| **PyDub** | 0.25.1 | Audio processing and manipulation |
| **SoundFile** | 0.12.1 | Audio file I/O operations |
| **NumPy** | 1.22.0-1.25 | Numerical operations for audio |
| **python-dotenv** | 1.0.0 | Environment variable management |
| **Werkzeug** | 3.0.1 | WSGI utilities and security |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and semantic markup |
| **CSS3** | Styling and responsive design |
| **JavaScript (ES6+)** | Client-side interactivity |
| **Web Audio API** | Microphone access and audio recording |
| **MediaRecorder API** | Audio capture in WebM format |

### AI Models
| Model | Size | Purpose |
|-------|------|---------|
| **Whisper Base** | ~150 MB | Speech recognition |
| **Gemini Flash** | Cloud-based | Natural language understanding |
| **gTTS Multilingual** | ~500 MB - 1 GB | Voice synthesis |

---

## ✨ Features

-  **AI-Powered Responses**: Uses Google Gemini for intelligent legal information
-  **Offline Voice Input**: Speech-to-Text using Faster-Whisper (no API required)
-  **Multilingual TTS**: Text-to-Speech in Arabic, English, Hindi, Filipino
-  **Multi-language Support**: Arabic, English, Hindi, Filipino
-  **Interactive Chat**: Sector-based navigation with guided conversations
-  **Privacy-First**: All voice processing happens locally on your machine
-  **Speed Optimization**: 1.3x audio playback for faster responses
-  **Smart Language Detection**: Automatic language identification
-  **Responsive Design**: Works on desktop and mobile browsers

---

## 🚀 Quick Start (One-Command Setup)

### Windows

```bash
# 1. Clone the repository
git clone <repository-url>
cd "تبين _v1"

# 2. Run setup script (installs everything automatically)
setup.bat

# 3. Configure your API key
# Edit .env and add your GEMINI_API_KEY

# 4. Start the application
start.bat
```

### Linux/Mac

```bash
# 1. Clone the repository
git clone <repository-url>
cd "تبين _v1"

# 2. Make scripts executable
chmod +x setup.sh start.sh

# 3. Run setup script
./setup.sh

# 4. Configure your API key
# Edit .env and add your GEMINI_API_KEY

# 5. Start the application
./start.sh
```

That's it! The chatbot will be available at `http://127.0.0.1:5000`

---

## 📋 Prerequisites

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **2-3 GB free disk space** (for AI models)
- **Internet connection** (for initial setup and Gemini API)
- **Microphone** (optional, for voice features)

---

## 📦 What Gets Installed

The setup script automatically installs:

### Core Dependencies
- Flask - Web framework
- Google Generative AI - Chatbot intelligence
- Werkzeug - WSGI utilities

### Voice Processing (Offline)
- Faster-Whisper - Speech-to-Text
- gTTS - Text-to-Speech
- PyDub - Audio processing
- SoundFile - Audio I/O

### AI Models (Auto-downloaded on first run)
- Whisper `base` model (~150 MB)
- gTTS multilingual model (~500 MB - 1 GB)

---

## 🔧 Manual Setup (Alternative)

If you prefer manual control:

```bash
# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run the application
python app.py
```

---

## 🌟 Usage

### Text Chat
1. Open `http://127.0.0.1:5000` in your browser
2. Select your preferred language
3. Choose a sector (Civil Status, Traffic, Passports, etc.)
4. Ask your questions!

### Voice Input
1. Click the **microphone button** 🎤
2. **Hold** while speaking
3. **Release** to transcribe
4. Your speech will be converted to text automatically

### Voice Output
1. Look for the **speaker icon** 🔊 on bot messages
2. Click to hear the response read aloud
3. Works in all supported languages

---

## 🗂️ Project Structure

```
تبين _v1/
├── app.py                  # Flask application & API endpoints
├── voice_service.py        # Voice processing (STT/TTS)
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (not in git)
├── .gitignore             # Git ignore rules
├── LICENSE                # MIT License
├── README.md              # This file
├── setup.bat              # Windows setup script
├── setup.sh               # Linux/Mac setup script
├── start.bat              # Windows start script
├── start.sh               # Linux/Mac start script
├── templates/
│   └── index.html         # Chat interface
├── static/
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       └── chat.js        # Client-side logic
└── venv/                  # Virtual environment (not in git)
```

---

## 🔐 Environment Variables

Create a `.env` file with:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
```

**Get Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🎯 Supported Legal Sectors

1. **الأحوال المدنية** - Civil Status
2. **المرور** - Traffic
3. **الجوازات** - Passports
4. **الجرائم المعلوماتية** - Cybercrime
5. **شؤون الوافدين** - Expat Affairs

---

## 🌐 Language Support

| Language | Code | STT | TTS | 
|----------|------|-----|-----|
| العربية | ar | ✅ | ✅ |
| English | en | ✅ | ✅ |
| हिंदी | hi | ✅ | ✅ |
| Filipino | tl | ✅ | ⚠️ |

*⚠️ Filipino TTS uses English voice as fallback*

---

## ⚡ Performance

### First Run
- Setup: ~5-10 minutes (model downloads)
- First STT request: ~10 seconds (model loading)
- First TTS request: ~8 seconds (model loading)

### Subsequent Runs
- STT (30s audio): ~3-5 seconds
- TTS (1 paragraph): ~2-4 seconds

### Optimization Tips
- Use GPU for 3-5x faster processing (edit `voice_service.py`)
- Use smaller Whisper models for speed (less accuracy)
- Close other resource-intensive applications

---

## 🐛 Troubleshooting

### "Python not found"
- Install Python 3.8+ and add to PATH
- Restart terminal after installation

### "Failed to install dependencies"
- Upgrade pip: `python -m pip install --upgrade pip`
- Install Visual C++ Build Tools (Windows)

### "Models downloading slowly"
- Be patient (1-3 GB download)
- Check internet connection
- Models cache in `~/.cache/huggingface`

### "Microphone not working"
- Allow microphone permission in browser
- Check system microphone settings
- Try Chrome/Edge (best compatibility)

### Voice features not working
- Ensure dependencies installed: `pip install -r requirements.txt`
- Check `voice_service.py` for errors
- Review terminal error messages for detailed troubleshooting

---

## 🔄 Updating

```bash
# Activate environment
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Pull latest changes
git pull

# Update dependencies
pip install -r requirements.txt --upgrade

# Restart application
python app.py
```

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Disclaimer**: This chatbot provides general information about Saudi laws and regulations. It is NOT a substitute for professional legal advice.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered responses
- **Faster-Whisper** - Speech-to-Text
- **gTTS** - Text-to-Speech
- **Flask** - Web framework
- **The Saudi Community** - For inspiration and support

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review terminal error messages
3. Ensure all dependencies are installed
4. Try reinstalling: `pip install -r requirements.txt --force-reinstall`
5. Open an issue on GitHub

---

