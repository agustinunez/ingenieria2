module.exports.encodeJSON =  function(obj) {

    obj = JSON.stringify(obj);

    return encodeURI(obj);
};