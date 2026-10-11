$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Key = "$env:USERPROFILE\Downloads\privatekey-1147315.pem"
$Host_ = "ubuntu@195.209.221.13"
$Jar = Join-Path $Root "seishin-backend\build\libs\karate-hub-0.0.1-SNAPSHOT.jar"

if (-not (Test-Path $Jar)) {
    Write-Host "JAR not found. Building..."
    Set-Location (Join-Path $Root "seishin-app")
    npm run build
    Set-Location (Join-Path $Root "seishin-backend")
    .\gradlew.bat bootJar -x test
}

$ssh = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new", $Host_)
$scp = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new")

Write-Host "Uploading files..."
scp @scp $Jar "${Host_}:/tmp/karate-hub.jar"
scp @scp (Join-Path $PSScriptRoot "application-prod.properties") "${Host_}:/tmp/application-prod.properties"
scp @scp (Join-Path $PSScriptRoot "seishin.service") "${Host_}:/tmp/seishin.service"
scp @scp (Join-Path $PSScriptRoot "nginx-seishin.conf") "${Host_}:/tmp/nginx-seishin.conf"

Write-Host "Installing on server..."
$remote = @"
set -e
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-21-jre-headless nginx
sudo mkdir -p /opt/seishin /var/lib/seishin
sudo mv /tmp/karate-hub.jar /opt/seishin/karate-hub.jar
sudo mv /tmp/application-prod.properties /opt/seishin/application-prod.properties
sudo chown -R ubuntu:ubuntu /opt/seishin /var/lib/seishin
sudo mv /tmp/seishin.service /etc/systemd/system/seishin.service
sudo systemctl daemon-reload
sudo systemctl enable seishin
sudo systemctl restart seishin
sudo mv /tmp/nginx-seishin.conf /etc/nginx/sites-available/seishin
sudo ln -sf /etc/nginx/sites-available/seishin /etc/nginx/sites-enabled/seishin
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status seishin --no-pager -l | head -20
"@
ssh @ssh ($remote -replace "`r`n", "`n")

Write-Host "Done. Open http://195.209.221.13"
