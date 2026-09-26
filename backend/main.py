from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

from database import (
    init_db,
    save_classification,
    get_all_classifications
)

app = FastAPI(
    title="Cacao Grade AI Backend API",
    description="Backend API for Cacao Grade AI",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CNN_SERVICE_URL = "http://127.0.0.1:8001/predict"

RECOMMENDATIONS = {
    "unfermented": "Dili pa fermented. Kinahanglan pa kining ipa-ferment pag-usab.",
    "partially_fermented": "Kulang pa ang fermentation para maabot ang husto nga quality.",
    "well-fermented": "Well-fermented cacao bean. Maayo para sa premium chocolate production.",
    "over-fermented": "Sobra na ang fermentation. Mahimong makaapekto sa flavor quality."
}


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def read_root():
    return {
        "status": "success",
        "message": "Cacao Grade AI Backend is running!"
    }


@app.get("/api/database-test")
def database_test():
    return {
        "status": "success",
        "message": "Backend is connected to PostgreSQL!"
    }


@app.post("/api/classify")
async def classify_image(file: UploadFile = File(...)):

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

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must not exceed 10MB."
        )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                CNN_SERVICE_URL,
                files={
                    "file": (
                        file.filename,
                        image_bytes,
                        file.content_type
                    )
                }
            )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"CNN service is unavailable: {str(e)}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="CNN service returned an error."
        )

    cnn_result = response.json()

    # CNN model is not trained yet
    if cnn_result.get("status") == "waiting":
        return {
            "status": "waiting",
            "message": "CNN model is not trained yet.",
            "filename": file.filename
        }

    predicted_class = cnn_result.get("predicted_class")
    confidence = cnn_result.get("confidence")

    if not predicted_class or confidence is None:
        raise HTTPException(
            status_code=502,
            detail="Invalid response from CNN service."
        )

    recommendation = RECOMMENDATIONS.get(
        predicted_class,
        "No recommendation available."
    )

    save_classification(
        filename=file.filename,
        label=predicted_class,
        confidence=confidence,
        recommendation=recommendation
    )

    return {
        "status": "success",
        "filename": file.filename,
        "predicted_class": predicted_class,
        "confidence": confidence,
        "recommendation": recommendation
    }


@app.get("/api/history")
def classification_history():

    rows = get_all_classifications()

    history = []

    for row in rows:
        history.append({
            "id": row[0],
            "filename": row[1],
            "predicted_class": row[2],
            "confidence": row[3],
            "recommendation": row[4],
            "created_at": row[5]
        })

    return {
        "status": "success",
        "count": len(history),
        "data": history
    }