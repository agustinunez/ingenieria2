module.exports = {
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            req.flash('warning','No puedes acceder a esta ruta!');
            return res.redirect('/');
        }
        return next();
    }
};