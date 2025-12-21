@echo off
echo Starting AutoMarketer...

start "AutoMarketer Backend" cmd /k "cd backend && python app.py"
start "AutoMarketer Frontend" cmd /k "cd frontend && npm run dev"

echo Services started!
echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:5173
echo.
echo Please ensure you have set your GOOGLE_API_KEY environment variable.
pause
