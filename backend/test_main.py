from fastapi.testclient import TestClient
from main import app
import os
from unittest.mock import patch, MagicMock

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "device" in response.json()

@patch("main.gTTS")
@patch("main.model")
@patch("main.processor")
def test_caption_endpoint_mocked(mock_processor, mock_model, mock_gtts):
    # Mocking the model and processor to avoid heavy inference during tests
    # processor() returns an object that has .to(), which returns the actual inputs dict
    mock_inputs = MagicMock()
    mock_inputs.to.return_value = {"pixel_values": "fake_tensor"}
    mock_processor.return_value = mock_inputs
    
    # Mock generate output
    mock_out = MagicMock()
    mock_model.generate.return_value = mock_out
    
    # Mock decode
    mock_processor.decode.return_value = "a lovely test image"

    # Mock gTTS
    mock_tts_instance = MagicMock()
    mock_gtts.return_value = mock_tts_instance
    mock_tts_instance.write_to_fp.return_value = None

    # Create a dummy image
    from PIL import Image
    import io
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    files = {"file": ("test.jpg", img_byte_arr, "image/jpeg")}
    
    response = client.post("/caption", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["caption"] == "a lovely test image"
    assert "audio" in data # Audio generation happens via gTTS, we might want to mock that too usually, but for now let's see if it runs fast enough or we mock it.

@patch("main.gTTS")
def test_audio_generation_mocked(mock_gtts):
    # Mock gTTS to avoid network calls to Google
    mock_tts_instance = MagicMock()
    mock_gtts.return_value = mock_tts_instance
    
    # Fake save method
    def side_effect(filename):
        with open(filename, 'wb') as f:
            f.write(b'fake_audio_data')
    mock_tts_instance.save.side_effect = side_effect

    # We need to run the full flow but with mocked TTS
    # ... logic allows reuse of previous test structure
    pass
