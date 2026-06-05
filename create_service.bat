@echo off
curl -s -X POST https://api.render.com/v1/services ^
  -H "Authorization: Bearer rnd_JljznP2OiN2In556weQXXmkT3MIM" ^
  -H "Content-Type: application/json" ^
  -d "@C:\Users\Nishanth.KR\Downloads\ai gym\payload.json"
