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
//查询购物车商品信息
var search_cart_products_list = function(shopping_carts,cb) {
	var product_ids = [];
	var carts_selected = [];
	for (var i = 0; i < shopping_carts.length; i++) {
		product_ids.push(shopping_carts[i].product_id);
		if (shopping_carts[i].is_selected == 1) {
			carts_selected.push(shopping_carts[i]);
		}
	}
	search_products_list(JSON.stringify(product_ids),function(err,content){
		if (!err) {
			var products_map = {};
			for (var i = 0; i < content.products.length; i++) {
				var product = content.products[i];
				products_map[product.id] = product;
			}

			var total_data = {};
			total_data.total_prices = 0;
			total_data.total_items = 0;
			for (var i = 0; i < carts_selected.length; i++) {
				total_data.total_items = total_data.total_items + carts_selected[i].total_items;
				total_data.total_prices = total_data.total_prices + carts_selected[i].total_items * carts_selected[i].per_price;
			}
			cb(false,{"message":"ok","shopping_carts":shopping_carts,"products":products_map,"total_data":total_data});
		}else {
			cb(true,null);
		}
	});
};

exports.register = function(server, options, next){
	//新增购物车
	var add_shopping_cart = function(product_id, per_price, total_items, total_prices, cart_code,person_id,cb){
		server.plugins['models'].shopping_carts.add_shopping_cart(product_id, per_price, total_items, total_prices, cart_code,person_id,function(err,results){
			cb(err,results);
		});
	};
	//发现有人购物车
	var find_person_cart = function(person_id,cb){
		server.plugins['models'].shopping_carts.search_cart_by_person(person_id,function(err,results){
			if (!err) {
				if (results.length ==0) {
					cb(false,{"message":"ok","shopping_carts":[],"products":{},"total_data":{}});
					return;
				}
				search_cart_products_list(results,function(err,row) {
					if (err) {
						cb(true,{"message":"error"});
						return;
					}
					cb(false,row);
				});
			}else {
				cb(true,{"message":"error"});
			}
		});
	};
	//得到无人的购物车
	var find_none_person_cart = function(cart_code,cb){
		server.plugins['models'].shopping_carts.search_cart_by_code(cart_code,function(err,results){
			if (!err) {
				if (results.length ==0) {
					cb(false,{"message":"ok","shopping_carts":[],"products":{},"total_data":{}});
					return;
				}
				search_cart_products_list(results,function(err,row) {
					if (err) {
						cb(true,{"message":"error"});
						return;
					}
					cb(false,row);
				});
			}else {
				cb(true,{"message":"error"});
			}
		});
	};

	server.route([
		//查询购物车里面商品数量
		{
			method: 'GET',
			path: '/check_cart_number',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				var cart_code = request.query.cart_code;
				var number = 0;
				if (!cart_code && !person_id) {
					return reply({"success":true,"message":"ok","number":number,"service_info":service_info});
				}
				if (person_id) {
					//有人
					server.plugins['models'].shopping_carts.find_shopping_items_person(person_id,function(err,rows){
						if (!err) {
							number = rows[0].num;
							return reply({"success":true,"message":"ok","number":number,"service_info":service_info});
						}else {
							return reply({"success":false,"message":results.message,"service_info":service_info});
						}
					});
				}else {
					//没人
					server.plugins['models'].shopping_carts.find_shopping_items_cart(cart_code,function(err,rows){
						if (!err) {
							number = rows[0].num;
							return reply({"success":true,"message":"ok","number":number,"service_info":service_info});
						}else {
							return reply({"success":false,"message":results.message,"service_info":service_info});
						}
					});
				}
			}
		},
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
						var product_map = {};
						for (var i = 0; i < shopping_carts.length; i++) {
							product_map[shopping_carts[i].product_id] = shopping_carts[i];
							all_items = all_items + shopping_carts[i].total_items;
						}
						if (!product_map[product_id]) {
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

				find_none_person_cart(cart_code,function(err,row) {
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":row.shopping_carts,"products":row.products,"total_data":row.total_data});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//得到有人购物车信息
		{
			method: 'GET',
			path: '/find_person_cart',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				console.log("person_id:"+person_id);

				find_person_cart(person_id,function(err,row) {
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":row.shopping_carts,"products":row.products,"total_data":row.total_data});
					}else {
						return reply({"success":false,"message":row.message,"service_info":service_info});
					}
				});
			}
		},
		//选中，更新选中的商品状态，或者取消选中状态，统计所有选中的商品价格，数量
		{
			method: 'POST',
			path: '/update_selected',
			handler: function(request, reply){
				var ids = request.payload.ids;
				var selected = request.payload.selected;
				var person_id = request.payload.person_id;
				if (!ids || !selected || !person_id) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.update_cart_selected(selected,JSON.parse(ids),function(err,results){
					if (!err) {
						server.plugins['models'].shopping_carts.search_cart_by_person(person_id,function(err,results){
							if (!err) {
								server.plugins['models'].shopping_carts.search_carts_by_selected(person_id,function(err,content){
									if (!err) {
										var total_data = {};
										total_data.total_prices = 0;
										total_data.total_items = 0;
										if (content.length == 0) {
											return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":results,"total_data":total_data});
										}
										for (var i = 0; i < content.length; i++) {
											total_data.total_items = total_data.total_items + content[i].total_items;
											total_data.total_prices = total_data.total_prices + content[i].total_items * content[i].per_price;
										}
										return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":results,"total_data":total_data});
									}else {
										return reply({"success":false,"message":results.message,"service_info":service_info});
									}
								});
							}else {
								return reply({"success":false,"message":results.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//购物车下订单页面
		{
			method: 'GET',
			path: '/search_selected_carts',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				var ids = request.query.ids;
				if (!person_id || !ids) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_carts_by_ids(JSON.parse(ids),function(err,results){
					if (!err) {
						search_cart_products_list(results,function(err,row) {
							if (!err) {
								return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":row.shopping_carts,"products":row.products,"total_data":row.total_data});
							}else {
								return reply({"success":false,"message":row.message,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//删除选中购物车
		{
			method: 'GET',
			path: '/delete_shopping_carts',
			handler: function(request, reply){
				var ids = request.query.ids;
				if (!ids) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.delete_carts(JSON.parse(ids),function(err,results){
					if (!err) {
						return reply({"success":true,"message":"ok","service_info":service_info});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//购物车 商品数量 +1
		{
			method: 'GET',
			path: '/plus_shopping_carts',
			handler: function(request, reply){
				var ids = request.query.ids;
				if (!ids) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_carts_by_ids(JSON.parse(ids),function(err,results){
					if (!err) {
						var cart = results[0];
						var id = cart.id;
						var per_price = cart.per_price;
						var total_items = cart.total_items+1;
						var total_prices = cart.total_prices + cart.per_price;
						server.plugins['models'].shopping_carts.update_cart_info(id,per_price,total_items,total_prices,function(err,results){
							if (!err) {
								return reply({"success":true,"message":"ok","service_info":service_info});
							}else {
								return reply({"success":false,"message":err,"service_info":service_info});
							}
						});
					}else {
						return reply({"success":false,"message":results.message,"service_info":service_info});
					}
				});
			}
		},
		//查询购物车商品
		{
			method: 'GET',
			path: '/sarch_cart_infos',
			handler: function(request, reply){
				var person_id = request.query.person_id;
				var cart_code = request.query.cart_code;
				if (person_id) {
					find_person_cart(person_id,function(err,row) {
						if (!err) {
							return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":row.shopping_carts,"products":row.products,"total_data":row.total_data});
						}else {
							return reply({"success":false,"message":row.message,"service_info":service_info});
						}
					});
				}else if (cart_code) {
					find_none_person_cart(cart_code,function(err,row) {
						if (!err) {
							return reply({"success":true,"message":"ok","service_info":service_info,"shopping_carts":row.shopping_carts,"products":row.products,"total_data":row.total_data});
						}else {
							return reply({"success":false,"message":row.message,"service_info":service_info});
						}
					});
				}else {
					return reply({"success":false,"message":row.message,"service_info":service_info});
				}
			}
		},
		//购物车 商品数量 +1
		{
			method: 'GET',
			path: '/reduce_shopping_carts',
			handler: function(request, reply){
				var ids = request.query.ids;
				if (!ids) {
					return reply({"success":false,"message":"params wrong","service_info":service_info});
				}
				server.plugins['models'].shopping_carts.search_carts_by_ids(JSON.parse(ids),function(err,results){
					if (!err) {
						var cart = results[0];
						var id = cart.id;
						var per_price = cart.per_price;
						var total_items = cart.total_items-1;
						if (total_items == 0) {
							return reply({"success":true,"message":"ok","service_info":service_info});
						}
						var total_prices = cart.total_prices - cart.per_price;
						server.plugins['models'].shopping_carts.update_cart_info(id,per_price,total_items,total_prices,function(err,results){
							if (!err) {
								return reply({"success":true,"message":"ok","service_info":service_info});
							}else {
								return reply({"success":false,"message":err,"service_info":service_info});
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
