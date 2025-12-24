"""
Voice Service Module for تبيّن Chatbot
Provides local Speech-to-Text (Faster-Whisper) and Text-to-Speech (Coqui TTS)
All processing runs offline without external API calls.
"""

import os
import tempfile
from pathlib import Path
from typing import Tuple, Optional
import logging
import subprocess
import imageio_ffmpeg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get FFmpeg executable path from imageio-ffmpeg
FFMPEG_BINARY = imageio_ffmpeg.get_ffmpeg_exe()
logger.info(f"Using FFmpeg binary at: {FFMPEG_BINARY}")

# Configure pydub to use the bundled FFmpeg
try:
    from pydub import AudioSegment
    AudioSegment.converter = FFMPEG_BINARY
    # pydub also needs ffprobe, but imageio-ffmpeg only provides ffmpeg. 
    # Often ffmpeg is enough for basic operations, or we might need to rely on system path for ffprobe.
    # However, for simple conversion/export, ffmpeg binary is the critical one.
except ImportError:
    logger.warning("pydub not installed, some audio features may fail")

# Lazy loading - models will be initialized on first use
_whisper_model = None


def get_whisper_model():
    """Initialize and return Faster-Whisper model (lazy loading)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            logger.info("Loading Faster-Whisper model...")
            
            # Use 'small' model for better accuracy than 'base', while still being reasonably fast on CPU
            # 'medium' would be even better but might be too slow without GPU
            _whisper_model = WhisperModel(
                "small",
                device="cpu",
                compute_type="int8"  # Use int8 for faster CPU inference
            )
            logger.info("Faster-Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    return _whisper_model


def transcribe_audio(audio_file_path: str) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Transcribe audio file to text using Faster-Whisper.
    
    Args:
        audio_file_path: Path to audio file (WAV, MP3, WebM, etc.)
    
    Returns:
        Tuple of (success, transcription, detected_language, error_message)
    """
    converted_path = None
    try:
        model = get_whisper_model()
        
        # Check if file needs conversion to WAV
        file_ext = Path(audio_file_path).suffix.lower()
        transcription_file = audio_file_path
        
        # Convert non-WAV files to WAV format with optimal parameters for Whisper
        if file_ext != '.wav':
            logger.info(f"Converting {file_ext} file to WAV (mono, 16000 Hz) for optimal Whisper processing...")
            
            # Create temporary WAV file path
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix='.wav',
                dir=tempfile.gettempdir()
            )
            converted_path = temp_file.name
            temp_file.close()
            
            # Convert using FFmpeg
            success, error = convert_to_wav(audio_file_path, converted_path)
            if success:
                transcription_file = converted_path
                logger.info(f"Conversion successful: {transcription_file}")
            else:
                # Log warning but attempt transcription with original file
                logger.warning(f"Conversion failed: {error}. Attempting transcription with original file.")
                # Clean up failed conversion file if it exists
                if os.path.exists(converted_path):
                    cleanup_audio_file(converted_path)
                converted_path = None
        else:
            logger.info("File is already in WAV format, skipping conversion.")
        
        # Transcribe with automatic language detection
        logger.info(f"Transcribing audio file: {transcription_file}")
        segments, info = model.transcribe(
            transcription_file,
            beam_size=5,
            vad_filter=True,  # Voice Activity Detection filter
            language=None  # Auto-detect language
        )
        
        # Combine all segments into full transcription
        transcription = " ".join([segment.text for segment in segments]).strip()
        detected_language = info.language
        
        logger.info(f"Transcription complete. Detected language: {detected_language}")
        logger.info(f"Transcription: {transcription[:100]}...")
        
        # Map Whisper language codes to our frontend language names
        language_map = {
            'ar': 'العربية',
            'en': 'English',
            'hi': 'हिंदी',
            'tl': 'Filipino',
            'fil': 'Filipino'
        }
        
        frontend_language = language_map.get(detected_language, 'العربية')
        
        return True, transcription, frontend_language, None
        
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return False, None, None, str(e)
    finally:
        # Clean up converted file if it was created
        if converted_path:
            cleanup_audio_file(converted_path)


def generate_speech(text: str, language: str = 'العربية', speed_up: bool = False, speed_factor: float = 1.3) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generate speech audio from text using gTTS (Google Text-to-Speech).
    
    Args:
        text: Text to convert to speech
        language: Language name ('العربية', 'English', 'हिंदी', 'Filipino')
        speed_up: Whether to speed up the audio (default: True)
        speed_factor: Speed multiplier (default: 1.3x)
    
    Returns:
        Tuple of (success, audio_file_path, error_message)
    """
    try:
        from gtts import gTTS
        import re
        
        # Map language names to gTTS language codes
        language_code_map = {
            'العربية': 'ar',
            'English': 'en',
            'हिंदी': 'hi',
            'Filipino': 'tl'  # Tagalog/Filipino
        }
        
        lang_code = language_code_map.get(language, 'ar')
        
        # Clean text for TTS: remove emojis, asterisks, and special symbols
        # Keep Arabic letters, English letters, numbers, and basic punctuation
        def clean_text_for_tts(text):
            # Remove emojis and symbols using regex
            # This regex keeps Arabic, English, numbers, whitespace, and basic punctuation
            # It removes most emojis and special characters
            cleaned = re.sub(r'[^\w\s\u0600-\u06FF\.,\?\!]', '', text)
            # Remove extra whitespace
            cleaned = re.sub(r'\s+', ' ', cleaned).strip()
            return cleaned
            
        cleaned_text = clean_text_for_tts(text)
        logger.info(f"Original text: {text[:50]}...")
        logger.info(f"Cleaned text for TTS: {cleaned_text[:50]}...")
        
        if not cleaned_text:
            logger.warning("Text became empty after cleaning, using original")
            cleaned_text = text
        
        # Create temporary file for generated audio
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.mp3',  # gTTS generates MP3 files
            dir=tempfile.gettempdir()
        )
        output_path = temp_file.name
        temp_file.close()
        
        logger.info(f"Generating speech for language: {language} ({lang_code})")
        
        # Generate speech using gTTS with cleaned text
        tts = gTTS(text=cleaned_text, lang=lang_code, slow=False)
        tts.save(output_path)
        
        logger.info(f"Speech generated successfully: {output_path}")
        
        # Apply speed-up if requested
        if speed_up and speed_factor != 1.0:
            success, sped_up_path, error = speed_up_audio(output_path, speed_factor)
            if success:
                # Clean up original file and use sped-up version
                cleanup_audio_file(output_path)
                output_path = sped_up_path
                logger.info(f"Audio sped up by {speed_factor}x: {output_path}")
            else:
                logger.warning(f"Failed to speed up audio, using original: {error}")
        
        return True, output_path, None
        
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        return False, None, str(e)


def speed_up_audio(input_path: str, speed_factor: float = 1.3) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Speed up audio file using FFmpeg 'atempo' filter.
    
    Args:
        input_path: Path to input audio file
        speed_factor: Speed multiplier (e.g., 1.3 for 30% faster)
    
    Returns:
        Tuple of (success, output_file_path, error_message)
    """
    try:
        logger.info(f"Speeding up audio by {speed_factor}x: {input_path}")
        
        # Create output file
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix='.mp3',
            dir=tempfile.gettempdir()
        )
        output_path = temp_file.name
        temp_file.close()
        
        # FFmpeg command for speed up
        # -filter:a "atempo=1.3" -vn (no video)
        command = [
            FFMPEG_BINARY,
            '-y',
            '-i', input_path,
            '-filter:a', f'atempo={speed_factor}',
            '-vn',
            output_path
        ]
        
        # Run FFmpeg command
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        
        logger.info(f"Audio sped up successfully: {output_path}")
        return True, output_path, None
        
    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg speed-up failed: {e.stderr}"
        logger.error(error_msg)
        return False, None, error_msg
    except Exception as e:
        logger.error(f"Audio speed-up error: {e}")
        return False, None, str(e)


def cleanup_audio_file(file_path: str) -> None:
    """
    Clean up temporary audio file.
    
    Args:
        file_path: Path to file to delete
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up audio file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup file {file_path}: {e}")


def convert_to_wav(input_path: str, output_path: str) -> Tuple[bool, Optional[str]]:
    """
    Convert audio file to WAV format using FFmpeg with specific parameters.
    The output WAV will be mono (1 channel) with 16000 Hz sample rate.
    
    Args:
        input_path: Path to input audio file (WebM, MP3, etc.)
        output_path: Path where the WAV file should be saved
    
    Returns:
        Tuple of (success, error_message)
    """
    try:
        logger.info(f"Converting audio to WAV: {input_path} -> {output_path}")
        
        # FFmpeg command: -y (overwrite), -i (input), -ac 1 (mono), -ar 16000 (sample rate)
        command = [
            FFMPEG_BINARY,
            '-y',  # Overwrite output file without asking
            '-i', input_path,  # Input file
            '-ac', '1',  # Audio channels: 1 (mono)
            '-ar', '16000',  # Audio sample rate: 16000 Hz
            output_path  # Output file
        ]
        
        # Run FFmpeg command
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            text=True
        )
        
        logger.info(f"Successfully converted to WAV: {output_path}")
        return True, None
        
    except subprocess.CalledProcessError as e:
        error_msg = f"FFmpeg conversion failed: {e.stderr}"
        logger.error(error_msg)
        return False, error_msg
    except FileNotFoundError:
        error_msg = "FFmpeg not found. Please install FFmpeg from https://ffmpeg.org/download.html"
        logger.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Audio conversion error: {str(e)}"
        logger.error(error_msg)
        return False, error_msg



def convert_audio_format(input_path: str, output_format: str = 'wav') -> Optional[str]:
    """
    Convert audio file to specified format using pydub.
    
    Args:
        input_path: Path to input audio file
        output_format: Desired output format ('wav', 'mp3')
    
    Returns:
        Path to converted file or None on error
    """
    try:
        from pydub import AudioSegment
        
        logger.info(f"Converting audio from {Path(input_path).suffix} to {output_format}...")
        
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Create output file
        temp_file = tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f'.{output_format}',
            dir=tempfile.gettempdir()
        )
        output_path = temp_file.name
        temp_file.close()
        
        # Export in desired format
        audio.export(output_path, format=output_format)
        
        logger.info(f"Converted audio: {input_path} -> {output_path}")
        return output_path
        
    except FileNotFoundError as e:
        logger.error(f"FFmpeg not found. Audio conversion requires FFmpeg to be installed: {e}")
        logger.error("Please install FFmpeg from https://ffmpeg.org/download.html")
        return None
    except Exception as e:
        logger.error(f"Audio conversion error: {e}")
        return None
