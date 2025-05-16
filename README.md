About:

PoachCoach is a dynamic platform reimagining how sports coaching is accessed and delivered in Singapore. Whether you're a student coach, a retired athlete, or a parent seeking the right fit for your child, PoachCoach bridges the gap between skilled but underutilized coaches and eager learners. Our app makes quality training more accessible, affordable, and human—think of it as tutoring, but for sports. With features like personalized coach profiles, availability scheduling, and in-app messaging, PoachCoach modernizes coaching beyond rigid academies.

But PoachCoach is more than a booking app—it’s a community. We foster mentorship, friendships, and sportsmanship. From dashboards that track progress to forums for parent advice, our platform goes beyond transactions. Our vision is to be Singapore’s go-to hub for sports coaching—a place where young athletes grow, coaches thrive, and everyone stays connected to the game they love.


Current Features:

Login Page (Authentication via Google not set-up yet)

Two step sign-up page for Coaches

Two step-sign-up page for Students 



Instructions on how to run the app:

First, download all the folders in Github as Zip File and unzip these files. In the api.ts file (frontend/src/services/api.ts), in line 3, change the IP address to your device's IP address (there is a comment directing you to update as needed).

To run the PoachCoach app locally, you’ll need to install dependencies in two places: the frontend folder (for the mobile app) and the backend folder (for the server and API).

First, make sure Node.js is installed on your computer. You’ll also need the Expo Go app installed on your phone.

Once you’ve downloaded the project and unzipped it, open a terminal and navigate into the frontend directory. There, run the command npm install. This will install all the necessary packages to run the mobile app, including React Native, Expo, and other supporting libraries.

After that, open a second terminal window and navigate to the backend directory. In that folder, run npm install as well. This installs all the packages needed to run the backend server, such as Express and Supabase client libraries.

Once both installations are complete, you can start the backend server first (from the backend folder) by running npm start, and then start the Expo development server for the frontend (from the frontend folder) by running npx expo start. Then, once you see something liek "Server is running on http://localhost:3000" on the backend terminal, scan the QR code displayed upon starting the Expo development server using your phone's Camera app to start testing on Expo Go.
