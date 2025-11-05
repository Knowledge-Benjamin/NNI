# NNI (Development branch)

This repository contains the NNI frontend and backend services.

Quick start (development)

1. Frontend

  - Copy `NNI_frontend/.env.example` to `NNI_frontend/.env` and fill the values.
  - Install dependencies and run dev server:

    npm install
    npm run dev

2. Backend

  - Copy `NNI_backend/.env.example` to `NNI_backend/.env` and fill the values.
  - Install dependencies and start the server:

    npm install
    node index.js

Important: Do NOT commit any `.env` files containing secrets (API keys, DB passwords,
or cloud credentials). This repo includes `.env.example` files to document required environment
variables. The top-level `.gitignore` ignores `.env` files.

Deployment notes

- Ensure all required environment variables are set on your deployment platform (HOSTED CI,
  Docker secrets, or cloud service environment).
- For ImgBB uploads, prefer the backend proxy (set `VITE_USE_IMGBB_PROXY=true` in frontend
  and `IMGBB_KEY` in backend) so the ImgBB key is not exposed to clients.

Git and branch

- This repo will use the `Development` branch for active work. After initializing git locally,
  create the `Development` branch and push to your remote:

    git checkout -b Development
    git remote add origin https://github.com/Knowledge-Benjamin/NNI.git
    git push -u origin Development
