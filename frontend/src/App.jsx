import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Camera, Volume2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

function App() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioBase64, setAudioBase64] = useState(null);
    const audioRef = useRef(null);

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
                // Auto-play audio when caption is received
                playAudio(response.data.audio);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to generate caption. Please check if the backend service is running.');
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
        <div className="app-container">
            <header>
                <h1>AI Vision</h1>
                <p className="subtitle">Empowering accessibility with context-aware image descriptions</p>
            </header>

            <main>
                <div className="upload-section">
                    {previewUrl ? (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Preview" />
                            <input type="file" accept="image/*" onChange={handleImageChange} aria-label="Upload new image" />
                        </div>
                    ) : (
                        <>
                            <Upload size={48} color="var(--primary)" />
                            <p>Drag & drop or click to upload</p>
                            <input type="file" accept="image/*" onChange={handleImageChange} aria-label="Upload image" />
                        </>
                    )}
                </div>

                <div className="button-group">
                    <button
                        className="btn-primary"
                        onClick={generateCaption}
                        disabled={!selectedImage || isLoading}
                    >
                        {isLoading ? <Loader2 className="spinner" /> : <Sparkles size={20} />}
                        {isLoading ? 'Processing...' : 'Generate Description'}
                    </button>
                </div>

                {error && (
                    <div className="result-section" style={{ borderColor: 'var(--error)' }}>
                        <p className="caption-text" style={{ color: 'var(--error)' }}>{error}</p>
                    </div>
                )}

                {caption && (
                    <div className="result-section">
                        <p className="caption-text">{caption}</p>
                        <div className="audio-controls">
                            <button
                                className="btn-primary"
                                onClick={() => playAudio(audioBase64)}
                                title="Play description"
                                aria-label="Play description"
                            >
                                <Volume2 size={24} />
                            </button>
                            <div className="status-indicator">
                                <ImageIcon size={16} />
                                <span>Context detected</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <audio ref={audioRef} hidden />
        </div>
    );
}

export default App;
