from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
import io
import os
import numpy as np

app = FastAPI(
    title="Cacao Grade AI - CNN Service",
    description="CNN interface service fro cacao fermentation classification",
    version="1.0.0"
)

#Expected CNN classes
CLASS_NAMES = [
    "unfermented",
    "partially_fermented",
    "well-fermented",
    "over-fermented"
]

#This will be the trained model after we train the CNN
MODEL_PATH = os.path.join("model", "cacao_cnn.keras")

model = None

#Load model only if it already exists
if os.path.exists(MODEL_PATH):
    try:
        from tensorflow.keras.models import load_model
        
        model = load_model(MODEL_PATH)
        print("CNN model loaded successfully!")
    
    except Exception as e:
        print("WARNING: CNN model could not be loaded.")
        print("Reason:", e)

else:
    print("WARNING: CNN model not found yet.")
    print("Expected:", MODEL_PATH)

@app.get("/")
def root():
    return {
        "status": "success",
        "service": "Cacao Grade AI CNN Service",
        "model_loaded": model is not None
    }
    
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    
    #Check file type
    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/jpg"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are allowed."
        )
    
    #Read image
    image_bytes = await file.read()
    
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )
    
    #If model is not trained yet 
    if model is None:
        return {
            "status": "waiting",
            "message": "CNN model is not trained yet.",
            "filename": file.filename
        }
    
    #Prepare image for CNN
    image = image.resize((224, 224))
    image_array = np.array(image, dtype=np.float32) / 255.0
    image_array = np.expand_DIMS(image_array, axis=0)
    
    ##CNN prediction
    predictions = model.predict(image_array, verbose=0)
    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_index])
    predicted_class = CLASS_NAMES[predicted_index]
    
    return {
        "status": "success",
        "filename": file.filename,
        "predicted_class": predicted_class,
        "confidence": confidence
    }