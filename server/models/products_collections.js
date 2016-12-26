var _ = require('lodash');
var EventProxy = require('eventproxy');

var products_collections = function(server) {
	return {
		//添加收藏
		add_collections : function(person_id, product_id, group_id, callback) {
			var query = `insert ignore into products_collections (id, person_id, product_id, group_id, create_at, update_at, flag)
				values
				(uuid(),?,?,?,now(),now(),0)`;
				var columns=[person_id, product_id, group_id];

			server.plugins['mysql'].pool.getConnection(function(err, connection) {
				connection.query(query, columns, function(err, results) {
					connection.release();
					if (err) {
						callback(true,results);
						return;
					}
					callback(false,results);
				});
			});
		},

	};
};

module.exports = products_collections;
