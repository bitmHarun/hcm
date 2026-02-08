from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class TextPayload(BaseModel):
    text: str

@app.post("/submit")
async def submit_text(payload: TextPayload):
    with open("output.txt", "a", encoding="utf-8") as f:
        f.write(payload.text + "\n")

    return {"response": "RECEIVED"}
