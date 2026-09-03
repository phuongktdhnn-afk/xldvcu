@echo off
cd /d "%~dp0"
title XLDV 2026 - Nhat ky he thong
echo ===== TRANG THAI =====
docker compose ps
echo.
echo ===== LOG =====
docker compose logs --tail=200
echo.
pause
