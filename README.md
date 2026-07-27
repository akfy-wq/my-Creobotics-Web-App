# Creobotics — Learn Robotics, Anywhere

Creobotics is a simple website for learning the basics of robotics. It works
entirely in your web browser, includes five short learning modules, and has a
quiz after each one to check what you've learned. You do not need to install
anything or set up a server to use it.

## What This App Does

- Lets you create an account and log in
- Teaches robotics through five easy-to-follow modules
- Gives you a short quiz after each module
- Unlocks the next module once you pass the quiz for the current one
- Keeps track of your progress and quiz scores
- Works in light mode or dark mode
- Works offline once the page has loaded, and needs no internet-based backend

## Who This Is For

This app is meant to be easy to use for anyone, regardless of age or
technical background. Whether you are a student, a teacher, a parent, or
just someone curious about robotics, you should be able to open the app and
start learning right away.

## The Five Learning Modules

1. Elements of a Robot
2. Robot's Hardware
3. Assembling a Robot
4. Makeblock Application
5. Line Follow

Each module includes short lessons with headings, explanations, and bullet
points, followed by a 6-question quiz. You need a score of 80% or higher to
pass a quiz and unlock the next module. You can retry a quiz as many times as
you like.

## Project Files

```
creobotics-web/
├── index.html       Main page (login, sign-up, and app screens)
├── css/
│   └── style.css     All the visual styling
└── js/
    ├── data.js        The content for all five modules and their quizzes
    └── app.js          The app's logic: login, progress tracking, quizzes
```

## How to Run It on Your Own Computer

You do not need to install any special software to try this app, but running
it through a simple local server (rather than just double-clicking the file)
is recommended, since some browsers limit certain features when a page is
opened directly from a folder.

1. Download or clone this project to your computer.
2. Open a terminal or command prompt in the project folder.
3. Run the following command:

   ```bash
   python3 -m http.server 8000
   ```

4. Open your web browser and go to:

   ```
   http://localhost:8000
   ```

If you don't have Python installed, you can also just double-click
`index.html` to open it directly in your browser. Most features will still
work this way.

## How to Put This App Online

Because this is a static website (no server or database required), you can
publish it for free using a service such as Netlify:

1. Go to app.netlify.com.
2. Drag and drop the `creobotics-web` folder onto the page, or connect it to
   a Git repository.
3. No extra setup or configuration is needed.

## How Your Information Is Stored

This app does not use an outside server or database. Instead, everything is
saved directly in your own browser, using a feature called `localStorage`.
This includes:

- Your account (your password is never stored as plain text — it is
  converted into a secure code called a hash before being saved)
- Which account is currently logged in
- Your progress and quiz scores for each module
- Your light/dark mode preference

Because everything is stored on your own device, your account and progress
will only be available on the browser you used to sign up. If you switch to
a different browser or device, you will need to create a new account there.

If you would like your account to work across multiple devices in the
future, this app can be connected to a real online database (for example,
Firebase or Supabase). This would require some additional setup.

## Questions or Requests

If you would like more quiz questions, additional modules, or the ability to
use your account on more than one device, these are all things that can be
added on request.
