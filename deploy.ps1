# Cloud Run Deployment Script for Degree-To-DUIT

$PROJECT_ID = "gen-lang-client-0246557294"
$REGION = "asia-southeast1"
$IMAGE_NAME = "degree-to-duit"
$API_KEY = "AIzaSyB1S2MSK60dgVSOc-LU9AgE8MD63s0vagU"

Write-Host "--- Starting Deployment Process ---" -ForegroundColor Cyan

# 1. Enable APIs
Write-Host "1. Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project $PROJECT_ID

# 2. Build via Cloud Build
Write-Host "2. Building container image via Cloud Build..."
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$IMAGE_NAME" --build-arg "NEXT_PUBLIC_GEMINI_API_KEY=$API_KEY" --project $PROJECT_ID

# 3. Deploy to Cloud Run
Write-Host "3. Deploying to Cloud Run..."
gcloud run deploy $IMAGE_NAME `
  --image "gcr.io/$PROJECT_ID/$IMAGE_NAME" `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 8080 `
  --project $PROJECT_ID

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
