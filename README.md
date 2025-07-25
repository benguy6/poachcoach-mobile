About:

PoachCoach is a dynamic platform reimagining how sports coaching is accessed and delivered in Singapore. Whether you're a student athlete, a retired coach, or a parent seeking the right fit for your child, PoachCoach bridges the gap between skilled but underutilized coaches and eager learners. Our app makes quality training more accessible, affordable, and human—think of it as tutoring, but for sports. With features like personalized coach profiles, availability scheduling, and in-app messaging, PoachCoach modernizes coaching beyond rigid academies.
But PoachCoach is more than a booking app—it’s a community. We foster mentorship, friendships, and sportsmanship. From dashboards that track student progress to a growing suite of tools supporting parents—like verified coach reviews, tailored recommendations, and forums for advice—our platform goes beyond transactions.

Our vision is to be Singapore’s go-to hub for sports coaching: a place where young athletes grow, coaches thrive, and families stay connected to the game they love.


User stories:

As an experienced athlete, I want to be able to find students to coach

As a university student or working adult, I want to be able to set my availability and limit the number of students I take on so I can balance coaching with my other commitments.

As a retired professional athlete, I want to be able to mentor young talent without committing to full-time coaching

As a coach who wants more accountability with payments by students, I want to be able to outsource these considerations to an external app.

As a coach, I want to easily see my booked sessions on a calendar.

As a beginner at the sport, I want to find a coach that can help build my foundation at a cheap price before I decide whether to fully commit to the sport.

As a student new to sports training, I want to be able to join a group training session rather than 1-on-1 lessons to save money and improve with peers.

As a student, I want to find a coach near me because I just want to pick up the sport but I do not have the time to travel right now.

As an already estabilished athlete, I want to be able to easily find an expert coach that can help me improve my craft and possibly try for 1-to-1 lessons.

As a parent, I want to be able to easily see all of my child’s coach’s information, which includes his experience and contact details.

As a parent who is unsure about coaching fees, I want to be able to compare different coaches based on their rates and experience to find the best fit for my child.

As a parent, I want to be able to trust that the training sessions are safe.

As a mother who wants to get regular feedback on the progress her son is making in the sport, I want to be able to get timely updates after every coaching session in the app.

As an admin, I want to be able to verify and approve coaches before their profiles go live to ensure quality and safety.


Core features:

Sign-in and sign-up page with basic authentication for user profiles, splitting up the students/parents and the coaches.

Coaches can create a profile to showcase their experience, qualifications, and rates, making it easier for students to find them.

Centralized coach database, that is built by collecting information from the coaches that have signed up.

A dashboard for both the student and the coach, showing their own respective information, such as the coach’s rating and experience, and the student’s progress reports and badges earned.

Coaches can set availability and manage training slots via an in-app calendar.

Location-based filtering allows students to find nearby coaches to reduce travel time. 

Students can search for and book a coach based on price, location, skill level, and training preferences (1-on-1 vs. group lessons)

In-app chat feature for direct communication between coaches and students/parents.


Current Features:

Login Page (Authentication via Google not set-up yet)

Two step sign-up page for Coaches

Two step-sign-up page for Students

Reset Password functionality

Email Verification with a functional landing page



Instructions on how to run the app:

First, download all the folders in Github as Zip File and unzip these files. In the api.ts file (frontend/src/services/api.ts), in line 3, change the IP address to your device's IP address (there is a comment directing you to update as needed).

To run the PoachCoach app locally, you’ll need to install dependencies in two places: the frontend folder (for the mobile app) and the backend folder (for the server and API).

First, make sure Node.js is installed on your computer. You’ll also need the Expo Go app installed on your phone.

Once you’ve downloaded the project and unzipped it, open a terminal and navigate into the frontend directory. There, run the command npm install. This will install all the necessary packages to run the mobile app, including React Native, Expo, and other supporting libraries.

After that, open a second terminal window and navigate to the backend directory. In that folder, run npm install as well. This installs all the packages needed to run the backend server, such as Express and Supabase client libraries.

Once both installations are complete, you can start the backend server first (from the backend folder) by running npm start, and then start the Expo development server for the frontend (from the frontend folder) by running npx expo start. Then, once you see something like "Server is running on http://localhost:3000" on the backend terminal, scan the QR code displayed upon starting the Expo development server using your phone's Camera app to start testing on Expo Go.


