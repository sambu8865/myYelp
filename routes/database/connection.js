function validate(callback,userName,password){
	var mysql = require('mysql');
	var db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
		});
	var sql = "select * from users where username='"+userName+"' and password ='" +password+"'" ;
	db.query(sql,function(err,rows,fields){
		if (err) return callback(true,null);
			console.log("DATA : "+JSON.stringify(rows));
			if(rows.length!=0){	
				var sql="update users set lastlogin=now() where username= '"+rows[0].username+"'";			
				db.query(sql,function(err,rows,fields){			
				if(err) throw err;			
				 });			
				}
			db.end();
			callback(err, rows);
		});
}

function signup(callback,fullname,email,phone,password){
	var mysql = require('mysql');
	var db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
		});
	var sql1="select * from users where username='"+email+"'";
	db.query(sql1,function(err,rows){
		if (err) res.end(err);
		if(rows.length!=0)
			callback("Email already registered",rows);
	var sql="insert into users (fullname,username,phone,password,lastlogin) values('"+fullname+"','"+email+"','"+phone+"','"+password+"',(select now() from dual))";
	db.query(sql,function(err,rows){
		if (err) throw err;
		 var sql2="select * from users where username='"+email+"'";	
		 db.query(sql2,function(err,rows){
			 db.end();
			 callback(err,fullname,rows);
		 });
		});
	});
}

function addplace(callback,pname,cname,address1,address2,phone,category,username,userid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql1="select cityid from city where cityname like '%"+cname+"%'";
	db.query(sql1,function(err,rows,fields){
		console.log(sql1);
		if(rows.length!=0)
		cityid=rows[0].cityid;
		if(rows.length==0)
		cityid=99999;	
		var sql2="select categoryid from category where categoryname like '%"+category+"%'";
		if (err) throw err;
			db.query(sql2,function(err,rows,fields){
				console.log(sql2);
				if(rows.length!=0){
				var categoryid=rows[0].categoryid;
				var sql = "insert into places (pname ,cityid ,address1 ,address2 ,phone ,categoryid,userid )values('"+ pname +"','"+cityid+"','"+address1+"','"+address2+"','"+phone+"','"+categoryid+"','"+userid+"')";
				if (err) throw err;
					db.query(sql,function(err){
						db.end();
						callback(err);
				console.log(sql);
			});
				}
				else 
				{
				var	sql3="insert into category (categoryname) values ('"+category+"')";
				db.query(sql3,function(err){
					console.log(sql3)
					if(err) throw err;
				});
				db.query(sql2,function(err,rows,fields){
					console.log(sql2);
					if(rows.length!=0)
					var categoryid=rows[0].categoryid;
					var sql = "insert into places (pname ,cityid ,address1 ,address2 ,phone ,categoryid,userid )values('"+ pname +"','"+cityid+"','"+address1+"','"+address2+"','"+phone+"','"+categoryid+"','"+userid+"')";
					if (err) throw err;
						db.query(sql,function(err){
							db.end();
							console.log(sql);
					callback(err);
				});
				});
				}	
				
		});
	});
}

function searchplaces(callback, category, cityname){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	
	var sql = "select placeid,pname,address1,address2,phone,(select max(review) from reviewplace where placeid=places.placeid group by placeid )review from places where categoryid=(select categoryid from category where categoryname='"+ category +"') and cityid=(select cityid from city where cityname like '%"+ cityname +"%')";
	db.query(sql,function(err,rows,fields){
		console.log(sql);
		if (err) throw err;
			console.log("DATA : "+JSON.stringify(rows));
			db.end();
			callback(err, rows,category,cityname);
		});
}


function reviewupdate(callback,placeid,score,COMMENTS,username,userid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "insert into review (placeid,score,userid,COMMENTS) values("+placeid+","+score+",'"+userid+"',\""+COMMENTS+"\")";
	console.log(sql);
	db.query(sql,function(err){
		if (err) throw err;
		db.end();
		callback(err, placeid,score);
		});
}

function fetch(callback){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "select pname from places";
	db.query(sql,function(err,rows,fields){
		if (err) throw err;
		if(rows.length!==0){
			console.log("DATA : "+JSON.stringify(rows));
			db.end();
			callback(err, rows);
		}});
}


function fetchplaces(callback,username,userid){
	console.log(username);
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "select placeid,pname,address1,address2,phone,(select review from reviewplace where placeid=places.placeid )review from places where userid='"+ userid+"'";
	db.query(sql,function(err,rows,fields){
		console.log(sql);
		if (err) throw err;
			console.log("DATA : "+JSON.stringify(rows));
			db.end();
			callback(err, rows);	
		});
}


function myreviews(callback,username,results,userid){
	console.log(username);
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "select reviewid,pname,address1,address2,score,comments from places a,review b where a.placeid=b.placeid and b.userid='"+ userid +"'";
	db.query(sql,function(err,rows,fields){
		console.log(sql);
		if (err) throw err;
			console.log("DATA : "+JSON.stringify(rows));
			db.end();
			callback(err, rows,results);	
		});
}


function deleteplaces(callback,placeid,username,userid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "delete from places where placeid='"+placeid+"'";
	db.query(sql,function(err){
		console.log(sql);
		if (err) throw err;
		var sql1 = "select placeid,pname,address1,address2,phone,(select review from reviewplace where placeid=places.placeid )review from places where userid='"+userid+"'";
		db.query(sql1,function(err,rows,fields){
			console.log(sql1);
			if(err) throw err;
		if(rows.length!==0){
			console.log("DATA : "+JSON.stringify(rows));
			db.end();
			callback(err, rows);				
		}
		else
			db.end();
			callback(err,rows);
		});
});
}

function deleteplace(callback,placeid,username,userid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "delete from places where placeid='"+placeid+"'";
	db.query(sql,function(err){
		console.log(sql);
		if (err) throw err;
		db.end();
		callback(err);
});
}

function deletereview(callback,reviewid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "delete from review where reviewid='"+reviewid+"'";
	db.query(sql,function(err){
		console.log(sql);
		if (err) throw err;
		db.end();
		callback(err);
});
}

function fetchreviews(callback,placeid){
	var mysql = require('mysql');
	var db = mysql.createConnection ({
		host: 'localhost',
		user: 'root',
		password: 'password',
		port: '3306',
		database: 'cmpe273'
	});
	var sql = "select score,comments from review where placeid='"+placeid+"' order by score desc";
	db.query(sql,function(err,rows){
		console.log(sql);
		if (err) throw err;
		db.end();
		callback(err,rows);
});
}

exports.fetchreviews = fetchreviews;
exports.searchplaces =searchplaces;
exports.validate=validate;
exports.fetch=fetch;
exports.reviewupdate=reviewupdate;
exports.addplace=addplace;
exports.fetchplaces=fetchplaces;
exports.deleteplaces=deleteplaces;
exports.myreviews=myreviews;
exports.deletereview=deletereview;
exports.deleteplace=deleteplace;
exports.signup=signup;