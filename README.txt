Orbit — Photo Sharing Website
Deliverable 2
Takunda Mugwagwa (u24667341)

GitHub repository:
https://github.com/topboy-taku/photo-sharing-website

-------------------------------------------------------------------------
MONGODB CONNECTION STRING
-------------------------------------------------------------------------

<PASTE YOUR MONGODB ATLAS CONNECTION STRING HERE BEFORE SUBMITTING>

This must be a WORKING connection string the markers can use directly —
double check Network Access in Atlas is set to "Allow access from anywhere"
(0.0.0.0/0), or the markers will not be able to connect and you will lose
marks for Part 1.

-------------------------------------------------------------------------
ONE-TIME SETUP: before building the backend image
-------------------------------------------------------------------------

1. Copy backend/.env.example to backend/.env
2. Paste your MongoDB connection string into backend/.env as MONGODB_URI
3. Seed the database with the minimum required data (2 users, 2 posts,
   1 album, 1 user with a friend) by running, from the backend folder:

   npm install
   npm run seed

   This creates two accounts you can log in with immediately:
     email: takunda@example.com   password: password123
     email: lindiwe@example.com   password: password123
   (they are already friends with each other, per the rubric requirement)

-------------------------------------------------------------------------
BUILDING AND RUNNING WITH DOCKER
-------------------------------------------------------------------------

Run these commands from the root of the project (the folder containing
this README).

1) Build and run the backend (Express + MongoDB, port 5000):

   cd backend
   docker build -t orbit-backend .
   docker run -p 5000:5000 --env-file .env --name orbit-backend orbit-backend

   (--env-file .env passes MONGODB_URI into the container — the Dockerfile
   does not bake in your .env file, by design, so it's never pushed to
   GitHub.)

2) Build and run the frontend (Vite/React, port 5173), in a new terminal:

   cd frontend
   docker build -t orbit-frontend .
   docker run -p 5173:5173 --name orbit-frontend orbit-frontend

3) Open the app:

   http://localhost:5173

To stop and remove the containers:

   docker stop orbit-frontend orbit-backend
   docker rm orbit-frontend orbit-backend

If you rebuild after changing code, remove the old container first:
   docker rm -f orbit-backend     (or orbit-frontend)
then repeat the docker build / docker run for that side.

-------------------------------------------------------------------------
PROJECT STRUCTURE
-------------------------------------------------------------------------

frontend/             Vite + React application
  src/components/     Reusable components (Header, Post, Profile, Album, forms...)
  src/pages/          Page-level components (Splash, Home, Profile, Post, Album, Search)
  src/api/client.js   All Fetch API calls to the backend live here
  Dockerfile, .dockerignore

backend/              Express + MongoDB API
  models/             Mongoose schemas: User, Post, Album
  routes/             auth.js, users.js, posts.js, albums.js
  middleware/auth.js  Simplified auth — frontend sends the logged-in user's
                      id as an x-user-id header on authenticated requests
  server.js           Express app entry point
  seed.js             Populates the required minimum dataset
  Dockerfile, .dockerignore

-------------------------------------------------------------------------
WHAT'S IMPLEMENTED
-------------------------------------------------------------------------

- Auth: signup, login, logout (all hit real MongoDB-backed endpoints)
- Profile: view (with restricted view for non-friends), edit, delete account
- Friends: send request, accept, decline, unfriend
- Posts: create (with image upload), edit, delete, like, comment, report
- Albums: create, edit, delete, add/remove posts, view
- Feeds: local (you + friends) and global (everyone), both live from MongoDB
- No dummy data remains in any component — everything renders from Fetch
  calls to the Express API
- Client-side validation retained on the Login and Sign up forms from D1

Not implemented (explicitly out of scope per the D2 spec):
- Admin functionality (edit/delete any user's content, report reasons)

Known limitations (time-boxed for the deadline — worth mentioning if asked
on the day):
- Auth uses a simplified scheme (the user's Mongo _id sent as an x-user-id
  header) rather than a signed JWT — adequate for this deliverable's "basic
  functionality" bar, not production-grade
- Images are stored as base64 data URLs directly in MongoDB documents
  rather than in separate file storage (e.g. GridFS or S3) — fine at this
  scale, would not scale well with many large images
