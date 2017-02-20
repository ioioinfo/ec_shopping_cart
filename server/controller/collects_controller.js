// Base routes for item..
const uu_request = require('../utils/uu_request');
var service_info = "ec shopping_cart service";

var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			cb(false, content);
		} else {
			cb(true, null);
		}
	});
};
exports.register = function(server, options, next){
	//添加收藏
	var add_collections = function(product_id,person_id,group_id,create_at,update_at,cb){
		server.plugins['models'].products_collections.add_collections(product_id,person_id,group_id,create_at,update_at,function(err,results){
			cb(err,results);
		});
	};

	//通过商品id找到商品
	var find_product_byId = function(product_id, cb){
		var url = "http://127.0.0.1:18002/product_info?product_id=";
		url = url + product_id;
		do_get_method(url,cb);
	};
	//创建购物车
	var add_shopping_cart = function(product_id, per_price, total_items, total_prices, cart_code,person_id,cb){
		server.plugins['models'].shopping_carts.add_shopping_cart(product_id, per_price, total_items, total_prices,cart_code, person_id,function(err,results){
			cb(err,results);
		});
	};
	//发现是否有同类商品
	var find_same_product = function(product_id,cart_code,cb){
		server.plugins['models'].shopping_carts.find_same_product(product_id, cart_code,function(err,row){
			cb(err,row);
		});
	};
	//更新购物车商品
	var update_shopping_cart = function(product_id,total_items,total_prices,cart_code,person_id,cb){
		server.plugins['models'].shopping_carts.update_shopping_cart(product_id,total_items,total_prices,cart_code, person_id,function(err,results){
			console.log(err);
			console.log(results);
			cb(err,results);
		});
	};
	//查询购物车商品数目
	var find_shopping_items = function(cb){
		server.plugins['models'].shopping_carts.find_shopping_items(function(err,rows){
			cb(err,rows);
		});
	};
	//展示购物车商品
	var show_shopping_carts = function(cart_code,cb){
		server.plugins['models'].shopping_carts.show_shopping_carts(cart_code,function(err,rows){
			cb(err,rows);
		});
	};
	//删除单个产品
	var delete_items = function(cart_code, product_ids,cb){
		server.plugins['models'].shopping_carts.delete_items(cart_code, product_ids,function(err,rows){
			cb(err,rows);
		});
	};
	server.route([
		//产品id获得同类商品,以及图片
		{
			method: 'POST',
			path: '/add_collections',
			handler: function(request, reply){
				var product_id = request.payload.product_id;
				var person_id = request.payload.person_id;
				var group_id = 0;

				add_collections(product_id,person_id,group_id,function(err, results){
					if (results.affectedRows>0) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":"add collections fail","service_info":service_info});
					}
				});
			}
		},
		//添加到购物车
		{
			method: 'GET',
			path: '/add_shopping_cart',
			handler: function(request, reply){
				var product_id = request.query.product_id;
				var total_items = request.query.total_items;
				var cart_code = request.query.cart_code;
				console.log(cart_code);

				if (!product_id || !total_items || !cart_code) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var person_id = request.query.person_id;
				//通过产品id找到单价，计算出总价
				find_product_byId(product_id, function(err, row){
					if (!err) {
						var product = row.row;
						var per_price = product.product_sale_price;
						var total_prices = per_price*total_items;
						console.log("total_prices: "+total_prices);
						//查询购物车是否有同类商品,同cookie的
						find_same_product(product_id, cart_code, function(err, row){
							if (!err) {
								if (row.length > 0) {
									console.log("row:"+JSON.stringify(row));
									console.log(row[0].total_items);
									total_items = parseInt(total_items) + parseInt(row[0].total_items);
									console.log(total_items);
									total_prices = per_price*total_items;
									update_shopping_cart(product_id,total_items,total_prices, cart_code, person_id, function(err,results){
										if (!err) {
											if (results.affectedRows>0) {
												return reply({"success":true,"message":"ok","product":product,"service_info":service_info});
											}else {
												return reply({"success":false,"message":"update shopping_cart fail","service_info":service_info});
											}
										}else {
											return reply({"success":false,"message":"update shopping_cart fail","service_info":service_info});
										}
									});
								}else {
									//创建新购物车
									add_shopping_cart(product_id, per_price, total_items, total_prices, cart_code,person_id, function(err, results){
										if (!err) {
											if (results.affectedRows>0) {
												return reply({"success":true,"message":"ok","product":product,"service_info":service_info});
											}else {
												return reply({"success":false,"message":"add shopping_cart fail","service_info":service_info});
											}
										}else {
											return reply({"success":false,"message":"add shopping_cart fail","service_info":service_info});
										}
									});
								}
							}
						});
					}else {
						return reply({"success":false,"message":row,"service_info":service_info});
					}
				});
			}
		},
		//查询购物车商品数目
		{
			method: 'GET',
			path: '/find_shopping_items',
			handler: function(request, reply){

				find_shopping_items(function(err, rows){
					if (!err) {
						return reply({"success":true,"message":"ok","rows":rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":"add collections fail","service_info":service_info});
					}
				});
			}
		},
		//查询购物车所有商品
		{
			method: 'GET',
			path: '/show_shopping_carts',
			handler: function(request, reply){
				var cart_code = request.query.cart_code;

				if (!cart_code) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}

				show_shopping_carts(cart_code, function(err, rows){
					if (!err) {
						return reply({"success":true,"message":"ok","rows":rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":"add collections fail","service_info":service_info});
					}
				});
			}
		},
		//删除多个购物车商品
		{
			method: 'GET',
			path: '/delete_items',
			handler: function(request, reply){
				var cart_code = request.query.cart_code;
				var product_ids = request.query.product_ids;

				if (!product_ids || !cart_code) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				product_ids = JSON.parse(product_ids);
				delete_items(cart_code, product_ids, function(err, rows){
					if (!err) {
						return reply({"success":true,"message":"ok","rows":rows,"service_info":service_info});
					}else {
						return reply({"success":false,"message":"delete item fail","service_info":service_info});
					}
				});
			}
		},

	]);

    next();
};

exports.register.attributes = {
    name: 'collects'
};
