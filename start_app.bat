@echo off
echo Starting AI Upscaler App...

:: Start Backend
echo Starting Backend Server...
start "Backend Server" cmd /k "venv\Scripts\activate && cd Backend_Upscaler && uvicorn server:app --reload"

:: Start Frontend
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd Frontend_Upscaler && npm run dev"

echo.
echo App is starting!
echo Backend: http://127.0.0.1:8000/health
echo Frontend: http://localhost:5173
echo.
pause
