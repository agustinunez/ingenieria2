const mysql = require('mysql');
const { promisify } = require('util');
const { database } = require('./keys');

const pool = mysql.createPool(database);

//Protocolo de conexion con la base de datos

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('La conexion con la base de datos fue cerrada');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('La base de datos tiene muchas conexiones');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('La conexion fue rechazada');
        }
    }
    if (connection) connection.release();
    console.log('Base de datos conectada');
    return;
});

// Promesas de consulta de base de datos

pool.query = promisify(pool.query);


// Exportacion de base de datos

module.exports = pool;