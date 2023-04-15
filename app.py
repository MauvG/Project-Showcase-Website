from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import api


# Create FastAPI app and add CORS middleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Total-Pages"]
)

# Add API routes
app.include_router(api.router)


# redirect to docs
@app.get("/")
async def index():
    return RedirectResponse(url="/docs", status_code=302)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app",
                host="localhost",
                port=5297,
                reload=False,
                log_level="info")
