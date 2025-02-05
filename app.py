from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from PIL import Image
import io
from starlette.requests import Request

app = FastAPI()

# Enable CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define paths for static files (CSS, JS) and templates (HTML)
BASE_DIR = Path(__file__).parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Serve static files (for CSS, JS, etc.)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# Check if the model file exists before loading
model_path = BASE_DIR / "mnist_model.h5"
if not model_path.exists():
    raise RuntimeError(f"Model file '{model_path}' not found. Ensure it's in the correct directory.")

# Load the trained MNIST model
model = load_model(str(model_path))

@app.get("/")
async def home(request: Request):
    """ Render the index.html file from the templates directory. """
    index_path = TEMPLATES_DIR / "index.html"
    if index_path.exists():
        return templates.TemplateResponse("index.html", {"request": request})
    else:
        return JSONResponse(content={"error": f"index.html not found in {index_path}"}, status_code=404)

@app.post("/predict/")
async def predict_digit(file: UploadFile = File(...)):
    """ Process uploaded image and return the predicted digit. """
    try:
        # Read image and convert to grayscale
        image = Image.open(io.BytesIO(await file.read())).convert("L")
        image = image.resize((28, 28))  # Resize to match MNIST format

        # Convert to NumPy array and normalize
        img_array = np.array(image) / 255.0
        img_array = img_array.reshape(1, 28, 28, 1)  # Add batch dimension

        # Predict using the model
        prediction = model.predict(img_array)
        predicted_digit = np.argmax(prediction)

        return JSONResponse(content={"predicted_digit": int(predicted_digit)})

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")