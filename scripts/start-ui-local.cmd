@echo off
cd /d C:\Users\himan\Project\codexWin\traceDashboard\frontend
call "C:\Program Files\nodejs\npm.cmd" run dev -- --host 0.0.0.0 1>> ui.out.log 2>> ui.err.log
