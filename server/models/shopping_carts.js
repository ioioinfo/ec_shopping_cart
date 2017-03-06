var _ = require('lodash');
var EventProxy = require('eventproxy');

var shopping_carts = function(server) {
	return {
		//无人购物车
		add_shopping_cart : function(product_id, per_price, total_items, total_prices, cart_code,person_id,cb) {
			var query = `insert into shopping_carts (id, product_id, per_price,
				total_items, total_prices, cart_code, person_id,created_at, updated_at, flag)
				values
				(uuid(),?,?,
				?,?,?,?,now(),now(),0)`;
				console.log(query);
			var columns=[product_id, per_price, total_items, total_prices,cart_code,person_id];
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//无人登入 查询购物车商品是否存在，同cookie
		find_same_product : function(product_id, cart_code,cb) {
			var query = `select total_items FROM shopping_carts where product_id =? and cart_code =? and flag =0`;

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [product_id,cart_code], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//无人更新购物车信息
		update_shopping_cart : function(product_id,total_items,total_prices, cart_code,person_id, cb) {
			var query = `update shopping_carts set total_items=?,total_prices=?,updated_at=now()
				where product_id =? and cart_code =? and flag =0`;

			var columns=[total_items,total_prices,product_id,cart_code];
			console.log(columns);
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//查看购物车商品总数
		find_shopping_items_person : function(person_id,cb) {
			var query = `select sum(total_items) num from shopping_carts where person_id =?`;
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[person_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//查看购物车商品总数
		find_shopping_items_cart : function(cart_code,cb) {
			var query = `select sum(total_items) num from shopping_carts where cart_code =?`;
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [cart_code],function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//购物车商品展现
		show_shopping_carts :function(cart_code,cb) {
			var query = `select * from shopping_carts where cart_code=?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[cart_code],function(err, rows) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,rows);
						return;
					}
					cb(false,rows);
				});
			});
		},
		//多个产品删除
		delete_items :function(cart_code,product_ids,cb) {
			var query = `delete from shopping_carts where cart_code = ? and
			product_id in (?)`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query,[cart_code,product_ids],function(err, rows) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,rows);
						return;
					}
					cb(false,rows);
				});
			});
		},
		//查询时候有cart_code
		search_cart_code : function(cart_code,cb) {
			var query = `select id,product_id,total_items FROM shopping_carts
			where cart_code =? and flag =0 and person_id is null`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [cart_code], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//查询时候有shopping carte
		search_shopping_cart : function(person_id,cb) {
			var query = `select id,product_id,total_items FROM shopping_carts
			where person_id =? and flag =0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [person_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//有人更新购物车信息
		update_person_cart : function(id,total_items,total_prices, cb) {
			var query = `update shopping_carts set total_items=?,total_prices=?,updated_at=now()
				where id =? and flag =0`;
			var columns=[total_items,total_prices,id];
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//更新之前有产品id的购物车信息
		update_cart_info : function(id,per_price,total_items,total_prices,cb) {
			var query = `update shopping_carts set per_price=?,total_items=?,
				total_prices = ?,updated_at=now() where id = ? and flag =0`;
			var columns=[per_price,total_items,total_prices,id];
			console.log(columns);
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//更新之前没有产品id的购物车信息
		update_cart_info2 : function(id,per_price,total_items,total_prices,cb) {
			var query = `update shopping_carts set per_price=?,total_items=?,
				total_prices = ?,updated_at=now() where id = ? and flag =0`;
			var columns=[per_price,total_items,total_prices,id];
			console.log(columns);
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//登入合并所有没有产品的人id
		update_person_id :function(person_id,ids,cb) {
			var query = `update shopping_carts set person_id=?,updated_at=now()
			 	where id in (?) and flag = 0`;
			var columns=[person_id,ids];
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//登入删除没有人id的购物车
		delete_carts:function(ids,cb){
			var query = `delete from shopping_carts where id in (?)`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [ids], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//查询购物车的所有
		search_all_cart : function(person_id,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
			total_prices FROM shopping_carts where person_id=?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [person_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//查询当前cart_code所有商品
		search_products_by_cart: function(cart_code,person_id,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
				total_prices,cart_code,is_selected
				FROM shopping_carts
				where
			`;

			var params;
			if (person_id) {
				query = query + ` person_id=? `;
				params = [person_id];
			} else {
				query = query + ` cart_code=? `;
				params = [cart_code];
			}

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, params, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//得到无人购物车信息
		search_cart_by_code: function(cart_code,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
			total_prices,cart_code,is_selected FROM shopping_carts where cart_code=?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [cart_code], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//得到有人购物车信息
		search_cart_by_person: function(person_id,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
			total_prices,cart_code,is_selected FROM shopping_carts where person_id=?`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [person_id], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//更新购物车商品选中状态
		update_cart_selected:function(selected,ids,cb) {
			var query = `update shopping_carts a set a.is_selected=?, a.updated_at=now()
			 	where a.id in (?) and a.flag = 0`;
			var columns=[selected,ids];
			console.log("columns:"+JSON.stringify(columns));
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
						return;
					}
					cb(false,results);
				});
			});
		},
		//查询被选中的商品
		search_carts_by_selected: function(cart_code,person_id,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
				total_prices,cart_code,is_selected FROM shopping_carts
				where is_selected = 1 and
			`;

			var params;
			if (person_id) {
				query = query + ` person_id=? `;
				params = [person_id];
			} else {
				query = query + ` cart_code=? `;
				params = [cart_code];
			}

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, params, function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},
		//更加cart ids查找选中商品
		search_carts_by_ids: function(ids,cb) {
			var query = `select id,product_id,total_items,person_id,per_price,total_items,
			total_prices,cart_code,is_selected FROM shopping_carts where id in (?) and flag = 0`;
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, [ids], function(err, results) {
					connection.release();
					if (err) {
						console.log(err);
						cb(true,results);
					}
					cb(false,results);
				});
			});
		},

	};
};

module.exports = shopping_carts;
