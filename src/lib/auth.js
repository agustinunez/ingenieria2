const pool = require('../database');
const { ROLE } = require('../lib/roles');
module.exports = {
    isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            req.flash('warning', 'No puedes acceder a esta ruta!');
            return res.redirect('/');
        }
        return next();
    },

    hasPermission(req, res, next) {
        if (!req.isAuthenticated()) {
            req.flash('warning', 'No puedes acceder a esta ruta!');
            return res.redirect('/');
        }
        return next();
    },

    async isAdmin(req, res, next) {
        if (req.isAuthenticated()) {
            const result = await pool.query('SELECT * FROM autoridad WHERE id_usuario=? AND rol=?', [req.user.id_usuario, ROLE.ADMIN]);
            if (result.length > 0) {
                return next();
            } else {
                req.flash('warning', 'No tienes los permisos para acceder a la ruta!');
            }
        } else {
            req.flash('warning', 'No puedes acceder a esta ruta!');
        }
        return res.redirect('/');
    }
}