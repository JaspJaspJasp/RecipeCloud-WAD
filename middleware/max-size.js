exports.globalErrorHandler = (err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        console.error("Blocked a massive file upload attempt!");
        return res.render('error', { 
            message: "The image you tried to upload is too large. Please keep images under 4MB.",
            user: req.session ? req.session.user : null 
        });
    }
}