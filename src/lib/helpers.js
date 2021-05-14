const bcrypt = require("bcryptjs");
const moment = require('moment');
var dateFormat = require("dateformat");
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
  if (combicomparar.fecha_salida = fechasalida && combicomparar.fecha_llegada == fechallegada) {
    if ((combicomparar.hora_salida < horasalida && combicomparar.hora_llegada > horallegada) ||
      (combicomparar.hora_salida > horasalida && combicomparar.hora_salida < horallegada) ||
      (combicomparar.hora_llegada > horasalida && combicomparar.hora_llegada < horallegada)) {
      return true
    } else {
      return false
    }
  } else {
    if (combicomparar.fecha_salida = fechasalida) {
      if (combicomparar.hora_salida < horallegada) {
        return true
      } else {
        return false
      }
    } else {
      if (combicomparar.fecha_llegada = fechallegada) {
        if (combicomparar.hora_llegada > horasalida) {
          return true
        } else {
           return flase }
      } else {
        if (combicomparar.fecha_salida < fechasalida && combicomparar.fecha_llegada > fechallegada) {
          return false
        } else {
          return true
        }
      }
    }
  }
};


module.exports = helpers;