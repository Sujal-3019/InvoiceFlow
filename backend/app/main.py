from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base,engine
from .routes import auth , clients , products , invoices , dashboard , users
from . import models
from fastapi.staticfiles import StaticFiles
from pathlib import Path


app=FastAPI()

UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)



Base.metadata.create_all(
    bind=engine
)



app.include_router(
    auth.router
)

app.include_router(
    clients.router
)

app.include_router(
    products.router
)

app.include_router(
    invoices.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    users.router
)


@app.get("/")
def home():

    return {
        "message":"API running"
    }