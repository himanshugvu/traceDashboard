@echo off
cd /d C:\Users\himan\Project\codexWin\traceDashboard\backend
call "C:\Users\himan\softwares\apache-maven-3.9.11\bin\mvn.cmd" spring-boot:run 1>> backend.out.log 2>> backend.err.log
