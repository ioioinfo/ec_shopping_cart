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
		find_shopping_items : function(cb) {
			var query = `select sum(total_items) num from shopping_carts `;
			console.log(query);
			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, function(err, results) {
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



	};
};

module.exports = shopping_carts;
