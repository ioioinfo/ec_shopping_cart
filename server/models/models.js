// Base routes for default index/root path, about page, 404 error pages, and others..
exports.register = function(server, options, next){

	server.expose('products_collections', require('./products_collections.js')(server));
	server.expose('shopping_carts', require('./shopping_carts.js')(server));
	next();
}

exports.register.attributes = {
    name: 'models'
};
