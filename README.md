# AI-Powered Image Captioning for the Visually Impaired

An accessible, AI-driven system that generates natural language descriptions for images and converts them to speech to assist visually impaired users.

## Key Features
- **Context-Aware Captions**: Uses the BLIP (Bootstrapping Language-Image Pre-training) model for high-quality, descriptive text.
- **Accessible UI**: High-contrast design with large interactive elements and audio-first feedback.
- **Audio Output**: Integrated Text-to-Speech (TTS) for automatic announcement of captions.
- **Docker Orchestration**: Simple setup using Docker Compose.
- **Offline Strategy (Design)**: Proposed fallback using quantized on-device models for reliability.

## Architecture
- **Backend**: FastAPI, PyTorch, Transformers (BLIP), gTTS, `uv` (package management).
- **Frontend**: React.js, Vite, Axios, Lucide-React.
- **Inference**: Vision Transformer (Encoder) + BERT-like Transformer (Decoder) using Beam Search.

## Prerequisites
- Docker & Docker Compose
- NVIDIA GPU with drivers (optional, but recommended for speed)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd Image-Captioning
   ```

2. **Run with Docker Compose:**
   ```bash
   docker compose up --build
   ```

3. **Access the App:**
   - Frontend: `http://localhost:3001`
   - Backend API Docs: `http://localhost:8001/docs`

## Model Explanation
We chose the **BLIP** model (`Salesforce/blip-image-captioning-base`) because it outperforms traditional CNN+LSTM architectures by leveraging:
1. **Multimodal Alignment**: It understands the relationship between visual features and linguistic tokens more deeply.
2. **Beam Search**: We use beam search (width=5) during inference to generate more coherent and descriptive sentences than a simple greedy approach.

## Offline Fallback Design
For users in remote areas, the system is designed to fallback to a lightweight client-side model:
- **Client Processing**: Use ONNX Runtime in the browser to run a quantized MobileNet encoder.
- **Degradation**: Instead of detailed captions, it provides "Primary Object Tags" (e.g., "Person, Dog, Outdoors") when the cloud API is unavailable.

## Limitations
- Large model size (requires ~1GB RAM/GPU memory).
- Initial latency during first load due to model weight downloading.



