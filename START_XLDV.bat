@echo off
setlocal
cd /d "%~dp0"
title XLDV 2026 - Khoi dong he thong

echo ======================================================
echo       XLDV 2026 - KHOI DONG HE THONG
 echo ======================================================
echo.

docker --version >nul 2>&1
if errorlevel 1 goto NODOCKER

docker compose version >nul 2>&1
if errorlevel 1 goto NODOCKER

echo [1/3] Dang khoi dong PostgreSQL va Web...
docker compose up -d --build
if errorlevel 1 goto FAIL

echo.
echo [2/3] Dang cho he thong san sang...
set /a COUNT=0
:WAIT
set /a COUNT+=1
curl -s http://localhost:4000/api/health >nul 2>&1
if not errorlevel 1 goto READY
if %COUNT% GEQ 60 goto FAILWAIT
ping 127.0.0.1 -n 2 >nul
goto WAIT

:READY
echo [3/3] He thong da san sang!
echo.
echo ------------------------------------------------------
echo Trang web: http://localhost:4000
echo Tai khoan Admin: admin / admin123
echo Tai khoan BGH:   bgh / bgh123
echo ------------------------------------------------------
echo.
start "" "http://localhost:4000"
echo Cua so nay co the dong sau khi trinh duyet da mo.
pause
exit /b 0

:NODOCKER
echo.
echo [LOI] May chua co Docker Desktop hoac Docker Compose.
echo.
echo Hay cai Docker Desktop, mo Docker Desktop, sau do chay lai file nay.
echo https://www.docker.com/products/docker-desktop/
echo.
pause
exit /b 1

:FAILWAIT
echo.
echo [LOI] Web chua san sang sau 60 giay.
echo Chay file XEM_LOI.bat de xem log.
echo.
pause
exit /b 1

:FAIL
echo.
echo [LOI] Khong khoi dong duoc he thong.
echo Chay file XEM_LOI.bat de xem log.
echo.
pause
exit /b 1
