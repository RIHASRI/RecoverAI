To run

Backend

cd backend
pip install -r requirements.txt
python seed.py
uvicorn main:app --host 127.0.0.1 --port 8000


Frontend

cd frontend
npm install
npm run dev


open http://localhost:3000/
