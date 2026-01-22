import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Upload,
    Volume2,
    Loader2,
    Sparkles,
    Image as ImageIcon,
    Copy,
    Download,
    RefreshCw,
    X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8001';

// Custom Hook for Typing Effect
function useTypingEffect(text, speed = 30) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        setDisplayedText('');
        if (!text) return;

        let i = 0;
        const timer = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(i));
            i++;
            if (i >= text.length) clearInterval(timer);
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed]);

    return displayedText;
}

function App() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioBase64, setAudioBase64] = useState(null);
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);

    const displayedCaption = useTypingEffect(caption);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setCaption('');
            setAudioBase64(null);
            setError('');
        }
    };

    const clearSelection = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setCaption('');
        setAudioBase64(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const generateCaption = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        setError('');
        setCaption('');

        const formData = new FormData();
        formData.append('file', selectedImage);

        try {
            const response = await axios.post(`${API_BASE_URL}/caption`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                setCaption(response.data.caption);
                setAudioBase64(response.data.audio);
                playAudio(response.data.audio);
            }
        } catch (err) {
            console.error(err);
            setError('Connection failed. Please ensure the backend is running at ' + API_BASE_URL);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = (base64) => {
        if (!base64) return;
        const audioBlob = b64toBlob(base64, 'audio/mpeg');
        const url = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
        }
    };

    const downloadAudio = () => {
        if (!audioBase64) return;
        const blob = b64toBlob(audioBase64, 'audio/mpeg');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caption-audio.mp3`;
        a.click();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(caption);
        // You could add a toast notification here
    };

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    };

    return (
        <>
            <div className="bg-blobs">
                <div className="blob"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="app-container">
                <header>
                    <h1>AI VISION</h1>
                    <p className="subtitle">Lending sight through intelligent scene understanding and spoken descriptions.</p>
                </header>

                <main>
                    <div className="upload-section" onClick={() => !previewUrl && fileInputRef.current.click()}>
                        {previewUrl ? (
                            <div className="preview-container">
                                <img src={previewUrl} alt="Preview" />
                                <button className="mini-btn" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.4)' }} onClick={(e) => { e.stopPropagation(); clearSelection(); }}>
                                    <X size={16} color="white" />
                                </button>
                            </div>
                        ) : (
                            <div className="loader-container">
                                <Upload size={56} color="var(--primary)" />
                                <p style={{ fontWeight: 600 }}>Drop an image here</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>or click to browse</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageChange}
                            hidden
                        />
                    </div>

                    <div className="button-group">
                        <button
                            className="btn-primary"
                            onClick={generateCaption}
                            disabled={!selectedImage || isLoading}
                        >
                            {isLoading ? (
                                <div className="dna-loader">
                                    <div className="dna-dot"></div>
                                    <div className="dna-dot"></div>
                                    <div className="dna-dot"></div>
                                    <div className="dna-dot"></div>
                                </div>
                            ) : (
                                <Sparkles size={22} className="sparkle-icon" />
                            )}
                            {isLoading ? 'Processing Scene...' : 'Describe Image'}
                        </button>

                        {previewUrl && !isLoading && (
                            <button className="btn-secondary" onClick={clearSelection}>
                                <RefreshCw size={20} />
                                Reset
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="result-section" style={{ borderLeft: '4px solid var(--error)' }}>
                            <p className="caption-text" style={{ color: 'var(--error)', fontSize: '1.1rem' }}>{error}</p>
                        </div>
                    )}

                    {caption && (
                        <div className="result-section">
                            <div className="caption-container">
                                <p className="caption-text">
                                    {displayedCaption}
                                    <span className="blinking-cursor">|</span>
                                </p>

                                <div className="caption-actions">
                                    <div className="action-buttons">
                                        <button className="mini-btn" onClick={() => playAudio(audioBase64)} title="Play Audio">
                                            <Volume2 size={20} />
                                        </button>
                                        <button className="mini-btn" onClick={copyToClipboard} title="Copy Text">
                                            <Copy size={20} />
                                        </button>
                                        <button className="mini-btn" onClick={downloadAudio} title="Download MP3">
                                            <Download size={20} />
                                        </button>
                                    </div>

                                    <div className="status-badge">
                                        <ImageIcon size={16} />
                                        <span>AI Analysis Complete</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <audio ref={audioRef} hidden />
            </div>

            <style>{`
        .blinking-cursor {
          margin-left: 5px;
          animation: blink 1s step-end infinite;
          color: var(--primary);
        }
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
        </>
    );
}

export default App;
