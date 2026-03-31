exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        console.log("User not logged in, redirecting to /login");
        return res.render('login', {
            error : 'You need to login to access this feature!',
            userName : ''
        });
    }
    next();
}

exports.isAdmin = (req, res, next) => {
    if (!req.session.user) {
        console.log("User not logged in, redirecting to /login");
        return res.redirect('/login');
    }
    if (req.session.user.role !== "admin") {
        console.log("Not an admin user, forbidden error rendered");
        return res.render("error",
            {message: "You do not have access to this resource.", statusCode: 403}
        );
    }
    next();
}
