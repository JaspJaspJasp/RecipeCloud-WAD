const bcrypt = require('bcrypt');
const UserModel = require("../models/user-model"); 
const session = require('express-session');

exports.registerGet = async (req, res) => {
    res.render("register", {
        errors: [],
        display_name: "",
        userName: "",
        gender: "",
        emailAddress: ""
    });
}

exports.registerPost = async (req, res) => {

    const display_name = (req.body.display_name ?? "").trim();
    const userName = (req.body.userName ?? "").trim();
    const gender = (req.body.gender ?? "").trim();
    const emailAddress = (req.body.emailAddress ?? "").trim();
    const password = (req.body.password ?? "").trim();
    const confirm_password = (req.body.confirm_password ?? "").trim();

    let errors = [];
    
    if (password !== confirm_password) {errors.push({msg: "Passwords do not match."});}
    if (password.length < 8) {errors.push({msg: "Password must be at least 8 characters long."});}

    
    try {
        
        const existingEmail = await UserModel.findUserByEmail(emailAddress);
        const existingUsername = await UserModel.findUserByUsername(userName);

        if (existingEmail) {errors.push({ msg: 'That email address is already registered.' });}
        if (existingUsername) {errors.push({ msg: 'That username is already taken.' });}

        if (errors.length > 0) {
        return res.render('register', {
            errors,
            display_name,
            userName,
            gender,
            emailAddress
        });
    }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            display_name,
            userName, 
            gender, 
            emailAddress, 
            hashedPassword
        };

        await UserModel.createUser(newUser);
        res.redirect('/login');

    } catch (error) {
        console.error("Error in checking for existing user: ", error);
        res.render('error', { 
            message: "We couldn't process your registration at this time. Please try again later." 
        });
    }
}

exports.displayUser = async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }

    const targetUserId = String(req.params.id);
    const sessionUserId = String(req.session.user.id);

    if (sessionUserId !== targetUserId) {
            return res.render('error', { message: "You are not authorised to view this profile." });
    }

    try {

        const user = await UserModel.findUserById(req.params.id);
        res.render('display-user', { user });

    } catch (err){

        console.error(err);
        res.render('error', { message: "Invalid User ID or Database Issue" });
    }
}

// getting user's data and rendering the edit-user page via the get route
exports.editUserGet = async (req, res) => {

    if (!req.session.user) {
            return res.redirect('/login');
    }

    const targetUserId = String(req.params.id);
    const sessionUserId = String(req.session.user.id);

    if (sessionUserId !== targetUserId) {
        return res.render('error', { message: "You are not authorised to view this profile." });
    }

    try {

        const user = await UserModel.findUserById(req.params.id);
        
        if (!user) {
            return res.render('error' , {
                message: "We couldn't find this user profile."
            });
        }

        return res.render('edit-user', {
            user, 
            errors: [],
            changes: []
        });

    } catch (err) {

        console.error(err);
        res.render('error', {
            message: "Invalid User ID or Database Issue"
        });
    }
}


exports.editUserPost = async (req, res) => {

    if (!req.session.user) {
        return res.redirect('/login');
    }


    const targetUserId = String(req.params.id);
    const sessionUserId = String(req.session.user.id);

    if (sessionUserId !== targetUserId) {
        return res.render('error', { message: "You are not authorised to edit this profile." });
    }

    const userID = req.params.id;
    const display_name = (req.body.display_name ?? "").trim();
    const userName = (req.body.userName ?? "").trim();
    const gender = (req.body.gender ?? "").trim();
    const emailAddress = (req.body.emailAddress ?? "").trim();

    let errors = [];
    let changes = [];

    try {
    
        const currentUser = await UserModel.findUserById(targetUserId);

        
        const existingEmail = await UserModel.findUserByEmail(emailAddress);
        const existingUsername = await UserModel.findUserByUsername(userName);

        if (existingEmail && String(existingEmail._id) !== targetUserId) {
            errors.push({ msg: 'The Email Address is already being used.'});
        }

        if (existingUsername && String(existingUsername._id) !== targetUserId) {
            errors.push({ msg: "Username is already taken."});
        }

        if (errors.length > 0) {
            return res.render("edit-user", {
                errors, 
                user: currentUser,
                changes
            });
        }

        
        if (currentUser.display_name !== display_name) changes.push("Display Name updated");
        if (currentUser.userName !== userName) changes.push("Username updated");
        if (currentUser.emailAddress !== emailAddress) changes.push("Email Address updated");
        if (currentUser.gender !== gender) changes.push("Gender updated");


        const updateData = {
            display_name, 
            userName,
            gender,
            emailAddress
        };

        
        await UserModel.updateUserById(targetUserId, updateData);
    
        req.session.user.display_name = display_name;
        req.session.user.userName = userName; 
        req.session.user.gender = gender; 
        req.session.user.emailAddress = emailAddress;
        
        const updatedUser = await UserModel.findUserById(targetUserId);

        res.render("edit-user", { 
            user: updatedUser, 
            errors, 
            changes
        });

    } catch(error) {
        console.error("Real system ERROR:", error);
        res.render("error", {
            message: "Failed to update profile."
        });
    }
}



exports.showLogin = async (req, res) => {
    res.render("login", { 
        userName: "",  
        error:"" 
    });
}


exports.checkLogin = async (req, res) => {
    const userName = (req.body.userName ?? "").trim();
    const password = (req.body.password ?? "").trim();

    try {
        const user = await UserModel.findUserByUsername(userName);

        if (!user) {
            return res.render("login", { 
                userName: "", 
                error: "No account found with that username."
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!isMatch) {
            return res.render("login", { 
                userName: userName, 
                error: "Incorrect password. Please try again."
            });
        }

        req.session.user = {
            id: String(user._id),
            userName: user.userName,
            display_name: user.display_name
        };

        console.log(`Login successful for: ${user.userName}`);
        return res.redirect("/");

    } catch (error) {
        console.error("Login Error: ", error);
        res.render("login", { 
            userName: "",
            error: "Internal server error. Please try again later."
        });
    }
}


exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.render('error', { 
                message: "There was a problem logging you out."
            });
        }
        res.redirect("/");
    });
}

