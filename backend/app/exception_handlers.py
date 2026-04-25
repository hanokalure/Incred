import sys
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from .main import app

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("Unhandled exception:", exc, file=sys.stderr)
    traceback.print_exc()
    
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_message": str(exc), "traceback": traceback.format_exc()},
        headers=headers
    )
