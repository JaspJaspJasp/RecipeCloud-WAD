# RECIPE CLOUD
WAD1 Digital Recipe Box Repository


Recipe Cloud is a full-stack web application that allows users to create, manage, and explore recipes. The system enables users to add their own recipes, view others’ recipes, and leave reviews.

This project is built using Node.js, Express.js, MongoDB, and EJS, following the MVC architecture, as part of IS113 – Web Application Development I.

---
### How to set up the application

1. Extract the submitted ZIP file.
2. Open the project folder in Visual Studio Code or any code editor.
3. Open the terminal in the project root folder.
4. Install all required dependencies:
        - npm i
5. Create a config.env file in the root folder if it is not already included.
    change the required environment variables inside config.env marked with <>:
    *PASTE THIS INSIDE YOUR CONFIG.ENV* 
    DB=mongodb+srv://<'USERNAME'>:<'PASSWORD'>@<'CLUSTERADDRESS'>/<'DBNAME'>?retryWrites=true&w=majority
    SECRET = '<'ANYTHING YOU WANT'>'
6. Run Server with nodemon server.js
7. Access and type http://127.0.0.1/8000 in a Chrome browser


       

## 📌 AI Usage Declaration


- ✅ All **CSS styling** in this project was generated using AI tools.
- ✅ Some **client-side scripts (JavaScript below EJS templates)** were generated using AI.

---
### USERNAME DETAILS 
- ADMIN : 
    username: admin
    password: password
- USER : 
    username: notadmin
    password: password

## 🚀 Features

### User management 
- Admins are able to view all user's display name, username and email
- Admins are able to edit the profile of all users
- Admins are not able to change their own roles
- Admins are able to edit all users roles

### 👤 Recipe/homepage Features
- Browse all recipes
- Search recipes by name
- Filter recipes by cuisine,tags and difficulty
- View detailed recipe pages
- Forum section to ask questions 
- Shopping list 
- Add recipes to Playlist

### 🍳 Recipe Management
- Create new recipes
- Only users who made that recipe can edit a recipes
- Only users who made that recipe can delete the recipes
- Each recipe includes:
  - Ingredients
  - Cuisine
  - Instructions
  - Tags
  - Cooking time
  - Difficulty level
  - Image
  - Username who created the recipe

### ⭐ Rating System 
- Logged-in users can see their previous rating to the recipe
- Rating records number of ratings and average ratings of recipes

### Shop system 
- Only logged-in users can:
  - Add and Remove Personal Items
  - Add and Remove Recipes from Favorites
  - Tick checkboxes when ingredients are bought
- Each recipe includes
  - Ingredients with checkboxes
### Forum system 
- Displays all Discussions  
- Allows everyone to view the discussions
- 
-
-
### Comments system 
-
-
-
-


### 
### 🔐 Authentication & Authorization
- User registration and login
- Session-based authentication
- Only logged-in users can:
  - Create recipes
  - Comment on recipes 
  -
  -
  -
  -
    
- Only recipe owners can:
  - Edit/Delete their recipes

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js (MVC Architecture)
- **Database**: MongoDB (Mongoose ODM)
- **Frontend**: EJS Templates
- **Environment**: Node.js 

---


