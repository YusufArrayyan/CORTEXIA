@echo off
set TOOLS=%~dp0..\..\tools
"%TOOLS%\mongodb-win32-x86_64-windows-7.0.25\bin\mongod.exe" --dbpath "%TOOLS%\mongo-data" --port 27017 --bind_ip 127.0.0.1
