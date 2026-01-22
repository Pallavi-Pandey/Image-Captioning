import io
import os
from typing import Optional

import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from gtts import gTTS
import base64

# Initialize FastAPI app
app = FastAPI(title="AI Image Captioning Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load BLIP model and processor
# Using base model for balance between performance and speed
MODEL_ID = "Salesforce/blip-image-captioning-base"
device = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading model {MODEL_ID} on {device}...")
processor = BlipProcessor.from_pretrained(MODEL_ID)
model = BlipForConditionalGeneration.from_pretrained(MODEL_ID).to(device)
print("Model loaded successfully.")

@app.get("/health")
def health_check():
    return {"status": "healthy", "device": device, "model": MODEL_ID}

@app.post("/caption")
async def generate_caption(file: UploadFile = File(...)):
    try:
        # Read image file
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Prepare image for the model
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        # Generate caption
        # Using beam search for better quality
        with torch.no_grad():
            out = model.generate(
                **inputs, 
                max_length=50, 
                num_beams=5, 
                early_stopping=True
            )
        
        caption = processor.decode(out[0], skip_special_tokens=True)
        
        # Generate Audio (TTS)
        # We'll return the audio as a base64 encoded string for the frontend to play
        tts = gTTS(text=caption, lang='en')
        audio_io = io.BytesIO()
        tts.write_to_fp(audio_io)
        audio_io.seek(0)
        audio_base64 = base64.b64encode(audio_io.read()).decode('utf-8')

        return {
            "caption": caption,
            "audio": audio_base64,
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
