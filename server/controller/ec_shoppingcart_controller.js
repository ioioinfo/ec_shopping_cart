// Base routes for item..
const uu_request = require('../utils/uu_request');
var service_info = "ec shopping_cart service";
var eventproxy = require('eventproxy');

var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			do_result(false, content, cb);
		} else {
			cb(true, null);
		}
	});
};
//所有post调用接口方法
var do_post_method = function(url,data,cb){
	uu_request.request(url, data, function(err, response, body) {
		console.log(body);
		if (!err && response.statusCode === 200) {
			do_result(false, body, cb);
		} else {
			cb(true,null);
		}
	});
};
//处理结果
var do_result = function(err,result,cb){
	if (!err) {
		if (result.success) {
			cb(false,result);
		}else {
			cb(true,result);
		}
	}else {
		cb(true,null);
	}
};
//查询产品信息
var search_products_list = function(product_ids,cb){
	var url = "http://127.0.0.1:18002/find_products_with_picture?product_ids=";
	url = url + product_ids;
	do_get_method(url,cb);
};
exports.register = function(server, options, next){
	//新增购物车
	var add_shopping_cart = function(product_id, per_price, total_items, total_prices, cart_code,person_id,cb){
		server.plugins['models'].shopping_carts.add_shopping_cart(product_id, per_price, total_items, total_prices, cart_code,person_id,function(err,results){
			cb(err,results);
		});
	};
	server.route([
		//没有人登入，没有购物车cookie，新建无人购物车
		{
			method: 'POST',
			path: '/new_none_person_cart',
			handler: function(request, reply){
				var cart_code = request.payload.cart_code;
				var product_id = request.payload.product_id;
				var total_items = request.payload.product_num;
				var per_price = request.payload.product_price;
				if (!cart_code || !product_id || !total_items || !per_price) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				var total_prices = per_price * total_items;
				var person_id;
				add_shopping_cart(product_id,per_price,total_items,total_prices,cart_code,person_id,
					function(err,result){
						if (result.affectedRows>0) {
							return reply({"success":true,"message":"ok","service_info":service_info});
						}else {
							return reply({"success":false,"message":"add none_person_cart fail","service_info":service_info});
						}
					});
			}
		},
		//是否存在cart_code
		{
			method: 'POST',
			path: '/search_cart_code',
			handler: function(request, reply){
				var cart_code = request.payload.cart_code;
				var product_id = request.payload.product_id;
				var total_items = request.payload.product_num;
				var per_price = request.payload.product_price;
				if (!cart_code || !product_id || !total_items || !per_price) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_cart_code(cart_code,function(err,results){
					if (!err) {
						var shopping_carts = results;
						var person_id;
						var total_prices;
						var all_items = parseInt(total_items);
						var param = 0;
						if (results.length == 0) {
							total_prices = per_price * total_items;
							add_shopping_cart(product_id,per_price,total_items,total_prices,cart_code,person_id,
								function(err,result){
									if (result.affectedRows>0) {
										return reply({"success":true,"message":"ok","param":param,"all_items":all_items,"service_info":service_info});
									}else {
										return reply({"success":false,"message":"add none_person_cart fail","service_info":service_info});
									}
								});
						}else {
							for (var i = 0; i < shopping_carts.length; i++) {
								if (shopping_carts[i].product_id == product_id) {
									total_items = parseInt(total_items) + shopping_carts[i].total_items;
								}
								all_items = all_items + shopping_carts[i].total_items;
							}
							total_prices = per_price * total_items;
							server.plugins['models'].shopping_carts.update_shopping_cart(product_id,total_items,total_prices, cart_code,person_id,function(err,results){
								if (!err) {
									param = 1;
									return reply({"success":true,"all_items":all_items,"param":param,"service_info":service_info});
								}else {
									return reply({"success":false,"message":err,"service_info":service_info});
								}
							});
						}
					}else {
						return reply({"success":false,"message":err,"service_info":service_info});
					}
				});
			}
		},
		//登入后，查询是否有shopping cart
		{
			method: 'POST',
			path: '/search_shopping_cart',
			handler: function(request, reply){
				var person_id = request.payload.person_id;
				var product_id = request.payload.product_id;
				var total_items = request.payload.product_num;
				var per_price = request.payload.product_price;
				var cart_code;
				if (!person_id || !product_id || !total_items || !per_price) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_shopping_cart(person_id,function(err,results){
					if (!err) {
						var shopping_carts = results;
						var total_prices;
						var all_items = parseInt(total_items);
						console.log("results.length:"+JSON.stringify(results));
						if (results.length == 0) {
							total_prices = per_price * total_items;
							add_shopping_cart(product_id,per_price,total_items,total_prices,cart_code,person_id,
								function(err,result){
									if (result.affectedRows>0) {
										return reply({"success":true,"all_items":all_items,"service_info":service_info});
									}else {
										return reply({"success":false,"message":"add none_person_cart fail","service_info":service_info});
									}
								});
						}else {
							var id;
							for (var i = 0; i < shopping_carts.length; i++) {
								if (shopping_carts[i].product_id == product_id) {
									total_items = parseInt(total_items) + shopping_carts[i].total_items;
									id = shopping_carts[i].id;
								}
								all_items = all_items + shopping_carts[i].total_items;
							}
							total_prices = per_price * total_items;
							server.plugins['models'].shopping_carts.update_person_cart(id,total_items,total_prices,function(err,results){
								if (!err) {
									return reply({"success":true,"all_items":all_items,"message":"ok","service_info":service_info});
								}else {
									return reply({"success":false,"message":err,"service_info":service_info});
								}
							});
						}
					}else {
						return reply({"success":false,"message":err,"service_info":service_info});
					}
				});
			}
		},
		//用户登入后，合并购物车,
		{
			method: 'GET',
			path: '/combine_shopping_cart',
			handler: function(request, reply){
				var cart_code = request.query.cart_code;
				var person_id = request.query.person_id;
				if (!person_id || !cart_code) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_products_by_cart(cart_code,person_id,function(err,results){
					if (!err) {
						var no_persons = [];
						var has_person = {};
						for (var i = 0; i < results.length; i++) {
							if (results[i].person_id) {
								has_person[results[i].product_id] = results[i];
							}else {
								no_persons.push(results[i]);
							}
						}
						var ids = [];
						var dele_ids = [];
						for (var i = 0; i < no_persons.length; i++) {
							if (has_person[no_persons[i].product_id]) {
								var id = has_person[no_persons[i].product_id].id;
								var per_price = no_persons[i].per_price;
								var total_items = has_person[no_persons[i].product_id].total_items + no_persons[i].total_items;
								var total_prices = no_persons[i].per_price * total_items;
								dele_ids.push(no_persons[i].id);
								server.plugins['models'].shopping_carts.update_cart_info(id,per_price,total_items,total_prices,function(err,results){
									if (!err) {
									}else {
										return reply({"success":false,"message":err,"service_info":service_info});
									}
								});
							}else {
								ids.push(no_persons[i].id);
							}
						}
						console.log("ids:"+ids);
						console.log("dele_ids:"+dele_ids);
							var ep =  eventproxy.create("updates","deletes",function(updates,deletes){
								return reply({"success":true,"message":"ok","service_info":service_info});
							});
						if (ids.length >0) {
							server.plugins['models'].shopping_carts.update_person_id(person_id,ids,function(err,results){
								if (!err) {
									ep.emit("updates",{});
								}else {
									ep.emit("updates",{});
								}
							});
						} else {
							ep.emit("updates",{});
						}
						if (dele_ids.length > 0) {
							server.plugins['models'].shopping_carts.delete_carts(dele_ids,function(err,results){
								if (!err) {
									ep.emit("deletes",{});
								}else {
									ep.emit("deletes",{});
								}
							});
						}else {
							ep.emit("deletes",{});
						}

					}else {
						return reply({"success":false,"message":err,"service_info":service_info});
					}
				});
			}
		},
		//得到无人的购物车
		{
			method: 'GET',
			path: '/find_none_person_cart',
			handler: function(request, reply){
				var cart_code = request.query.cart_code;
				server.plugins['models'].shopping_carts.search_cart_by_code(cart_code,function(err,results){
					if (!err) {
						if (results.length ==0) {
							return reply({"success":true,"message":"ok","shopping_carts":{},"service_info":service_info});
						}
						var product_ids = [];
						for (var i = 0; i < results.length; i++) {
							product_ids.push(results[i].product_id);
						}
						search_products_list(JSON.stringify(product_ids),function(err,content){
							if (!err) {
								var products_map = {};
								for (var i = 0; i < content.products.length; i++) {
									var product = content.products[i];
									products_map[product.id] = product;
								}
								return reply({"success":true,"shopping_carts":results,"products":products_map,"message":"ok","service_info":service_info});
							}else {
								return reply({"success":false,"message":"error","service_info":service_info});
							}
						});

					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},





	]);

    next();
};

exports.register.attributes = {
    name: 'shopping_carts'
};
