var correo = $('#recipient-email');
correo.on("keyup", validarCorreo)
function validarCorreo() {
    if (correo.val().length < 5) {
        correo.addClass('is-invalid');
    } else {
        correo.removeClass('is-invalid');
        correo.addClass('is-valid');
    }
};
/*var name2 = $('#recipient-name');
name2.focusout(function () {
    if (name2.val() == null || name2.val() == "") {
        name2.attr("placeholder", "Complete este campo.");
        name2.addClass('is-invalid');
    } else {
        name2.removeAttr('placeholder')
        name2.removeClass('is-invalid');
        name2.addClass('is-valid');
    };
});*/
