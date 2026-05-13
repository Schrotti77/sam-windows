@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "DRIVE="
set "BUILD_EXIT=1"

pushd "%ROOT%" || exit /b 1

if exist scripts\patch-react.js (
  node scripts\patch-react.js
  if errorlevel 1 goto :fail
)

for %%D in (Z Y X W V U T S R Q P O N M L K J I H G F E D) do (
  if not exist "%%D:\" (
    set "DRIVE=%%D:"
    goto :drive_found
  )
)

echo ERROR: No unused drive letter available for temporary build mapping.
goto :fail

:drive_found
subst %DRIVE% "%ROOT%"
if errorlevel 1 goto :fail

pushd %DRIVE%\
npm run build
set "BUILD_EXIT=%ERRORLEVEL%"
popd

subst %DRIVE% /d >nul 2>nul
popd
exit /b %BUILD_EXIT%

:fail
set "BUILD_EXIT=%ERRORLEVEL%"
if defined DRIVE subst %DRIVE% /d >nul 2>nul
popd
exit /b %BUILD_EXIT%
