const bcrypt = require("bcryptjs");
const moment = require('moment');
var dateFormat = require("dateformat");
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const helpers = {};

helpers.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

helpers.matchPassword = async (password, savedPassword) => {
  try {
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e);
  }
};

helpers.combiViajagando = (fechasalida, horasalida, fechallegada, horallegada, combicomparar) => {
  combicomparar.fecha_salida = dateFormat(combicomparar.fecha_salida, "yyyy-mm-dd");
  combicomparar.fecha_llegada = dateFormat(combicomparar.fecha_llegada, "yyyy-mm-dd");
  if (fechasalida == combicomparar.fecha_salida && fechallegada == combicomparar.fecha_llegada) {
    if (fechasalida != fechallegada) {
      return true;
    } else {
      if ((combicomparar.hora_salida < horasalida && combicomparar.hora_llegada > horallegada) ||
        (combicomparar.hora_salida > horasalida && combicomparar.hora_salida < horallegada) ||
        (combicomparar.hora_llegada > horasalida && combicomparar.hora_llegada < horallegada)) {
        return true
      } else {
        return false
      }
    }
  } else {
    if (combicomparar.fecha_llegada == fechasalida) {
      if (horasalida >= combicomparar.hora_llegada) {
        return false
      } else {
        return true
      }
    } else {
      if (combicomparar.fecha_salida == fechallegada) {
        if (horallegada < combicomparar.hora_salida) {
          return false
        } else {
          return true 
        }
      } else {
        if (combicomparar.fecha_salida < fechasalida && combicomparar.fecha_llegada > fechallegada) {
          return true
        } else {
          return false
        }
      }
    }
  }
};

helpers.duracion = ( horaSalida, horaLlegada ) => {
  var partSalida = horaSalida.match(/(\d+):(\d+)/);
  var partLlegada = horaLlegada.match(/(\d+):(\d+)/);
  var duracion = { hh: 0, mm: 0 };
  duracion.hh = partLlegada[1] - partSalida[1];
  if (partLlegada[2] < partSalida[2]) {
    duracion.hh = duracion.hh - 1;
    duracion.mm = +partLlegada[2] + (60 - partSalida[2]);
  } else {
    duracion.mm = partLlegada[2] - partSalida[2];
  }
  if (duracion.hh < 0) {
    duracion.hh = duracion.hh + 24
  }
  return duracion.hh+':'+ ((duracion.mm == 0)? '00':duracion.mm);
};

helpers.getRandomString = ( length ) => {
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

helpers.sendMail = async ( content, mailSubject, email ) => {

    const contentHTML = content;
    const CLIENT_ID = "125203151603-0ivipfkf95b21id2lv1dgvcvm2qg1feq.apps.googleusercontent.com";
    const CLIENT_SECRET = "fzUL8J_BFQG2UqixXDmI15wO";
    const REDIRECT_URI = "https://developers.google.com/oauthplayground";
    const REFRESH_TOKEN = "1//04o2J6CZNZwQaCgYIARAAGAQSNwF-L9Irq2e0wRCm5X2MEFKMWtUsvXdLnj6LNHe0DWsla58UdxKJxMql8KJQIirrBnU6by6Kn14";

    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "enterprise.combi19@gmail.com",
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken
            }
        });
        const mailOptions = {
            from: "Equipo Combi-19 <enterprise.combi19@gmail.com>",
            to: email,
            subject: mailSubject,
            html: contentHTML
        };

        const result = await transporter.sendMail(mailOptions)
        return result
    } catch (error) {
        console.log(error);
    }
}

module.exports = helpers;