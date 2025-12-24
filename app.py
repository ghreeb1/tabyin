import os
import uuid
import base64
from flask import Flask, render_template, request, jsonify, session, send_file, redirect, url_for, flash
import google.generativeai as genai
import tempfile
import voice_service
from dotenv import load_dotenv
from database import db, User, init_db
from flask_login import LoginManager, login_user, login_required, logout_user, current_user

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Login Manager Configuration
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize Database
init_db(app)

# Configure Gemini API securely from .env file
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

# Audio configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'webm', 'wav', 'mp3', 'm4a', 'ogg'}

def allowed_file(filename):
    """Check if file has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ask_gemini(prompt):
    """
    Sends a prompt to Gemini API and returns the text response.
    """
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
    
        system_context = (
            "أنت 'تبيّن'، مساعد قانوني ذكي ومحترف للمواطنين في السعودية. "
            "\n\n"
            "⚡ **قواعد الرد (مهم جداً):**\n"
            "1. **إجابات واضحة ومتوازنة (4–6 جمل كحد أقصى)\n"
            "2. **تجنب التفاصيل الإضافية تماماً** - اركز على الإجابة المباشرة فقط\n"
            "3. **استخدم التنسيق البسيط**:\n"
            "   - نقطة أو اثنين للإجابة الموجزة\n"
            "   - عنوان واحد فقط إن لزم الحال\n"
            "4. **ابدأ بالمعلومة الأهم مباشرة** - بدون مقدمات\n"
            "\n"
            "💰 **الغرامات والعقوبات:**\n"
            "- المبلغ + السبب فقط\n"
            "- مثال: 'الغرامة: 300 ريال لاستخدام الجوال أثناء القيادة'\n"
            "\n"
            "✅ **معايير عامة:**\n"
            "- معلومات سعودية فقط\n"
            "- بدون استشارات شخصية\n"
            "- مهذب ومباشر\n"
            "- رموز تعبيرية قليلة جداً\n"
            "\n\n"
        )
        full_prompt = system_context + prompt
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."

@app.route('/')
def index():
    return render_template('landing.html')

@app.route('/home')
@login_required
def home():
    return render_template('home.html', user=current_user)

@app.route('/guest-login', methods=['GET', 'POST'])
def guest_login():
    if request.method == 'POST':
        session['is_guest'] = True
        session['guest_name'] = "زائر"
        return redirect(url_for('home'))
    return render_template('guest_login.html')

@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        email = request.form.get('email')
        # Logic to send reset email or reset directly would go here
        flash('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'info')
        return redirect(url_for('login'))
    return render_template('reset_password.html')

@app.route('/profile')
def profile():
    if not current_user.is_authenticated and not session.get('is_guest'):
        return redirect(url_for('login'))
    return render_template('profile.html', user=current_user if current_user.is_authenticated else {'username': session.get('guest_name', 'Guest')})

@app.route('/delete-account', methods=['POST'])
@login_required
def delete_account():
    # Implement account deletion logic
    user = User.query.get(current_user.id)
    if user:
        db.session.delete(user)
        db.session.commit()
        logout_user()
    flash('تم حذف الحساب بنجاح', 'success')
    return redirect(url_for('index'))

@app.route('/faqs')
def faqs():
    return render_template('faqs.html')

@app.route('/contact-staff', methods=['GET', 'POST'])
@login_required
def contact_staff():
    if request.method == 'POST':
        # Logic to save question
        flash('تم إرسال سؤالك للموظفين', 'success')
        return redirect(url_for('home'))
    return render_template('staff_question.html')

@app.route('/rate-answer', methods=['POST'])
def rate_answer():
    # API for rating
    data = request.json
    # save rating logic
    return jsonify({'status': 'success', 'message': 'Rating received'})

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        identifier = request.form.get('identifier') # username or email
        password = request.form.get('password')
        user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('home'))
        flash('اسم المستخدم أو كلمة المرور غير صحيحة', 'error')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('اسم المستخدم موجود بالفعل', 'error')
        elif User.query.filter_by(email=email).first():
            flash('البريد الإلكتروني مسجل بالفعل', 'error')
        else:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('home'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/chat', methods=['GET'])
def chat_interface():
    if not current_user.is_authenticated and not session.get('is_guest'):
         return redirect(url_for('login'))
    return render_template('chat.html', user=current_user if current_user.is_authenticated else {'username': session.get('guest_name', 'Guest')})

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    # Store user message in session (optional, for simple history tracking in this demo)
    if 'history' not in session:
        session['history'] = []
    session['history'].append({'role': 'user', 'content': user_message})

    # Get bot response
    bot_response = ask_gemini(user_message)

    # Store bot response
    session['history'].append({'role': 'bot', 'content': bot_response})
    session.modified = True

    return jsonify({'response': bot_response})

@app.route('/voice-to-text', methods=['POST'])
def voice_to_text():
    """
    Endpoint for Speech-to-Text using Faster-Whisper (local processing).
    Accepts audio file, transcribes it, generates bot response, and returns
    both transcription and TTS audio response.
    """
    temp_path = None
    try:
        # Check if audio file is in the request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
        
        if not allowed_file(audio_file.filename):
            return jsonify({'error': 'Invalid file format'}), 400
        
        # Save the file temporarily with a unique name to avoid collisions
        file_ext = os.path.splitext(audio_file.filename)[1]
        if not file_ext:
            file_ext = '.webm' # Default fallback
            
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        temp_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        audio_file.save(temp_path)
        
        # Check file size
        file_size = os.path.getsize(temp_path)
        print(f"Saved audio file: {temp_path}, Size: {file_size} bytes")
        
        if file_size == 0:
            return jsonify({'error': 'Uploaded file is empty'}), 400
        
        # Transcribe using local Faster-Whisper
        success, transcription, detected_language, error = voice_service.transcribe_audio(temp_path)
        
        if not success:
            return jsonify({'error': error or 'Transcription failed'}), 500
        
        # Generate bot response using Gemini
        bot_response = ask_gemini(transcription)
        
        # Generate TTS audio response with speed-up
        tts_success, audio_response_path, tts_error = voice_service.generate_speech(
            bot_response, 
            detected_language,
            speed_up=True,
            speed_factor=1.3
        )
        
        if not tts_success:
            print(f"TTS generation failed: {tts_error}")
            # Still return transcription and text response even if TTS fails
            return jsonify({
                'success': True,
                'transcription': transcription,
                'language': detected_language,
                'response': bot_response,
                'audio_available': False
            })
        
        # Return the audio file
        response = send_file(
            audio_response_path,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='response.mp3',
            max_age=0
        )
        
        # Add custom headers with transcription data
        # Base64 encode to handle Arabic/Unicode text in HTTP headers
        safe_transcription = base64.b64encode(transcription.encode('utf-8')).decode('ascii')
        safe_response_text = base64.b64encode(bot_response.encode('utf-8')).decode('ascii')
        
        # Map language name to code for header (ASCII-safe)
        language_code_map = {
            'العربية': 'ar',
            'English': 'en',
            'हिंदी': 'hi',
            'Filipino': 'tl'
        }
        lang_code = language_code_map.get(detected_language, detected_language)
        
        response.headers['X-Transcription'] = safe_transcription
        response.headers['X-Response-Text'] = safe_response_text
        response.headers['X-Language'] = lang_code  # Send language code, not name
        response.headers['X-Encoding'] = 'base64'
        
        return response
    
    except Exception as e:
        print(f"Error in voice-to-text: {e}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temporary input file
        if temp_path and os.path.exists(temp_path):
            voice_service.cleanup_audio_file(temp_path)
        # Note: audio_response_path cleanup happens after file is sent by Flask

@app.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    """
    Endpoint for Text-to-Speech using gTTS (local processing with speed-up).
    Accepts text and language parameter.
    Returns generated audio file sped up by 1.3x.
    """
    audio_path = None
    try:
        data = request.json
        text = data.get('text')
        language = data.get('language', 'العربية')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Generate speech with 1.3x speed-up
        success, audio_path, error = voice_service.generate_speech(
            text, 
            language,
            speed_up=True,
            speed_factor=1.3
        )
        
        if success and audio_path:
            # Send file to client
            return send_file(
                audio_path,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name='response.mp3',
                max_age=0
            )
        else:
            return jsonify({'error': error or 'TTS generation failed'}), 500
    
    except Exception as e:
        print(f"Error in text-to-speech: {e}")
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Note: We can't clean up immediately as the file needs to be sent
        # Flask will handle this, but for production consider a cleanup task
        pass

if __name__ == '__main__':
    app.run(debug=True)
