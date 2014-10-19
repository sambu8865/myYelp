/**
 * Module dependencies.
 */

var express = require('express')
, ejs = require("ejs")
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , database = require('./routes/database/connection')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3002);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.cookieParser());
app.use(express.session({secret:'123456789QWERTY'}));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/signup',function(req, res){
 res.render('signup', { title: 'SignUp',error_name:"",error_email:"",error_phone:"",error_pwd:""});
});

app.get('/signout',function(req,res){
	req.session.destroy();
	res.render('index', { title: 'Yelp' ,error:''});
});

app.post('/signedup',function(req,res){
	var error_name="";
	var error_phone="";
	var error_pwd="";
	var error_email="";
	
	
	if(!req.param('fullname').match("^[a-zA-Z\\s]+"))
		return res.render('signup', { title: 'SignUp',error_name:"Not a valid name",error_email:"",error_phone:"",error_pwd:""});                              
	if(!req.param('email').match(/^.+@.+\..+$/))
		return res.render('signup', { title: 'SignUp',error_name:"",error_email:"Not a valid email",error_phone:"",error_pwd:""});
	if(!req.param('phonenumber').match("^[0-9]+$"))
		return res.render('signup', { title: 'SignUp',error_name:"",error_email:"",error_phone:"Not a valid phone number",error_pwd:""});
	if(!req.param('password').match("(?!^[0-9]*$)(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{8,10})$"))
		return res.render('signup', { title: 'SignUp',error_name:"",error_email:"",error_phone:"",error_pwd:"Not a valid password"});
	
	database.signup(function(err,username,results){
		if(err) return res.send(err);
		req.session.userid=results[0].userid;
		req.session.username=username;
		req.session.loggedin=true;
		req.session.lastlogin="";
		ejs.renderFile ('views/home.ejs', 
				{title : 'Yelp',username:username,results:results,lastlogin:req.session.lastlogin},
				function(err, results) {
					if (!err) {
						req.session.id = results[0].id;
						req.session.lastlogin=results[0].lastlogin;
						res.end(results);
						console.log(req.session.id+" "+req.session.username+" "+req.session.userid);
					}
					// render or error
					else {
						res.end('An error occurred');
						console.log(err);
					}
				});
	},req.param('fullname'),req.param('email'),req.param('phonenumber'),req.param('password'));
});

app.post('/home',function (req, res) {
	if(typeof req.param('username')=='undefined' ||typeof req.param('password')=='undefined') {
		res.statusCode = 400;
		return res.send('No Values provided');
	}
	if(req.param('username').match(/^.+@.+\..+$/))
		{
	database.validate(function(err,results){
		if(err){
			res.render('index', { title: 'Yelp' ,error:''});
		}else{
			if(results.length!=0){
			var test=JSON.stringify(results);
			req.session.username=results[0].fullname;
			req.session.userid=results[0].userid;
			req.session.loggedin=true;
			req.session.lastlogin=results[0].lastlogin;
			ejs.renderFile ('views/home.ejs', 
					{title : 'Yelp',username:results[0].fullname,results:results,lastlogin:req.session.lastlogin},
					function(err, results) {
						if (!err) {
							req.session.id = results[0].id;
							res.end(results);
							console.log(req.session.id+" "+req.session.username+" "+req.session.userid);
						}
						// render or error
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});}
			else{
					res.render('index', { title: 'Yelp',error:'Invalid username or password' });		
			}
		}
},req.param('username'),req.param('password'));}
	else
		{
		res.render('index', { title: 'Yelp',error:'Not a valid email address' });
		}
});

app.get('/myhome',function(req,res){
	if(req.session.username)
		res.render('home', { title: 'Yelp',username:req.session.username,lastlogin:req.session.lastlogin });
	else
	res.render('index', { title: 'Yelp' ,error:''});
});

app.get('/add',function(req,res){
	res.render('addplace',{title:'Add Place',id:req.session.id,error_pname:'',error_cname:'',error_phone:'',error_add1:'',error_add2:'',error_cat:''});
});

app.get('/remove',function(req,res){
	res.render('removeplace',{title:'Remove Place'});
});

app.post('/myaccount',function(req,res){
	database.fetchplaces (function(err,results1){
		if(err){
			throw err;
		}else{
			database.myreviews (function(err,results,results1){
				if(err){
					throw err;
				}else{
					console.log(results);
			ejs.renderFile ('views/myaccount.ejs', 
					{title : 'My Account',results:results,results1:results1},
					function(err, results) {
						if (!err) {
							res.end(results);
						}
						// render or error
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
			console.log("here2");
		}
	},req.session.username,results1,req.session.userid);}
		},req.session.username,req.session.userid);
});

app.get('/search',function(req,res){
	if(!req.param('search').match(/^[A-z]+$/))
		return res.send('No Values provided');
	if(!req.param('place').match("^[a-zA-Z0-9]+$"))
		return res.send('No Values provided');
	database.searchplaces (function(err,results,category,cityname){
		if(err){
			throw err;
		}else{
			console.log(results);
			ejs.renderFile ('views/searchresults.ejs', 
					{title : 'Search results',results:results,category:category,cityname:cityname},
					function(err, results) {
						if (!err) {
							res.end(results);
						}
						// render or error
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
		}
	},req.param('search'),req.param('place'));
});

app.get('/reviewpage',function(req,res){
	console.log(req.session.id+" "+req.session.username);
	database.fetchreviews(function(err,results){
		if(err) throw err;
	res.render('reviewpage',{title:'Review Place',id:req.session.id,placeid:req.param('placeid'),placename:req.param('placename'),username:req.session.loggedin,error:"",results:results});
	},req.param('placeid'));
});

app.get('/review',function(req,res){
	if(!req.session.loggedin)
		{
		if(typeof req.param('username')=='undefined' ||typeof req.param('password')=='undefined') {
			res.statusCode = 400;
			return res.send('Login to review');
		}
		if(req.param('username').match(/^.+@.+\..+$/))
			{
		database.validate(function(err,results){
			if(err){
				throw err;
			}else{
				if(results.length!=0){
				var test=JSON.stringify(results);
				req.session.username=results[0].fullname;
				req.session.loggedin=true;
				req.session.userid=results[0].userid;
				req.session.id = results[0].id;
				if(typeof req.param('placeid')=='undefined' ) {
					res.statusCode = 400;
					return res.send('No Values provided');
				}
				if (typeof req.param('score')=='undefined'){
					res.statusCode = 400;
					return res.send('No Values provided1');
				}
				database.reviewupdate (function(err,placeid,score){
					if(err){
						throw err;
					}else{
						console.log('review updated '+ req.session.username);
						res.render('home',{title:'Home',username:req.session.username,lastlogin:req.session.lastlogin});
					}
				},req.param('placeid'),req.param('score'),req.param('comments'),req.session.username,req.session.userid);
				}
				else{
					console.log("here");
						//res.render('index', { title: 'Yelp',error:'Not a valid email address' });
						res.render('reviewpage',{title:'Review Place',id:req.session.id,placeid:req.param('placeid'),placename:req.param('placename'),username:req.session.loggedin,error:"Invalid username or password"});
				}
				}
		},req.param('username'),req.param('password'));
		}
		 	}
	else{
	if(typeof req.param('placeid')=='undefined' ) {
		res.statusCode = 400;
		return res.send('No Values provided');
	}
	if (typeof req.param('score')=='undefined'){
		res.statusCode = 400;
		return res.send('No Values provided1');
	}
	database.reviewupdate (function(err,placeid,score){
		if(err){
			throw err;
		}else{
			console.log('review updated '+ req.session.username);
	
			res.render('home',{title:'Home',username:req.session.username,lastlogin:req.session.lastlogin});
		}
	},req.param('placeid'),req.param('score'),req.param('comments'),req.session.username,req.session.userid);
	}
});


app.post('/addp',function(req,res){
	if(!req.param('pname').match("^[a-zA-Z0-9 ]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_pname:'Fill the Place Name',error_cname:'',error_phone:'',error_add1:'',error_add2:'',error_cat:''});
	if(!req.param('cname').match("^[a-zA-Z0-9 ]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_cname:'Fill the City Name/zipcode',error_pname:'',error_phone:'',error_add1:'',error_add2:'',error_cat:''});
	if(!req.param('address1').match("^[a-zA-Z0-9 ]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_add1:'Fill the Address line 1',error_pname:'',error_cname:'',error_phone:'',error_add2:'',error_cat:''});
	if(!req.param('address2').match("^[a-zA-Z0-9 ]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_add2:'Fill the address Line 2',error_pname:'',error_cname:'',error_phone:'',error_add1:'',error_cat:''});
	if(!req.param('phone').match("^[a-zA-Z0-9]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_phone:'Fill the Phone number',error_pname:'',error_cname:'',error_add1:'',error_add2:'',error_cat:''});
	if(!req.param('category').match("^[a-zA-Z ]+$") ) 
		return res.render('addplace',{title:'Add Place',id:req.session.id,error_cat:'Fill the Category',error_pname:'',error_cname:'',error_phone:'',error_add1:'',error_add2:''});
	console.log('In addplace');
	database.addplace(function(err){
		console.log('In function');
		if(err){
			throw err;
		}else{
			console.log('added new place '+ req.session.username);
				
			res.render('home',{title:'Home',username :req.session.username,lastlogin:req.session.lastlogin});
		}
	},req.param('pname'),req.param('cname'),req.param('address1'),req.param('address2'),req.param('phone'),req.param('category'),req.session.username,req.session.userid);
});

app.get('/fetchplaces',function(req,res){
	database.fetchplaces (function(err,results){
		if(err){
			throw err;
		}else{
			console.log(results);
			ejs.renderFile ('views/myplaces.ejs', 
					{title : 'My Places',results:results},
					function(err, results) {
						if (!err) {
							res.end(results);
						}
						// render or error
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
		}
	},req.session.username,req.session.userid);
	
});

app.get('/delete',function(req,res){
	database.deleteplaces (function(err,results){
		if(err){
			throw err;
		}else{
			console.log(results);
			ejs.renderFile ('views/myplaces.ejs', 
					{title : 'My Places',results:results},
					function(err, results) {
						if (!err) {
							res.end(results);
						}
						// render or error
						else {
							res.end('An error occurred');
							console.log(err);
						}
					});
		}
	},req.param('placeid'),req.session.username,req.session.userid);
	
});

app.get('/deleteplace',function(req,res){
	database.deleteplace (function(err){
		if(err){
			throw err;
		}else{
			database.fetchplaces (function(err,results1){
				if(err){
					throw err;
				}else{
					console.log("here1");
					console.log(results1);
					database.myreviews (function(err,results,results1){
						if(err){
							throw err;
						}else{
							console.log(results);
					ejs.renderFile ('views/myaccount.ejs', 
							{title : 'My Account',results:results,results1:results1},
							function(err, results) {
								if (!err) {
									res.end(results);
								}
								// render or error
								else {
									res.end('An error occurred');
									console.log(err);
								}
							});
					console.log("here2");
				}
			},req.session.username,results1,req.session.userid);}
				},req.session.username,req.session.userid);
		}
	},req.param('placeid'),req.session.username,req.session.userid);
	
});

app.get('/deletereview',function(req,res){
	database.deletereview (function(err){
		if(err){
			throw err;
		}else{
			console.log('Here');
			database.fetchplaces (function(err,results1){
				if(err){
					throw err;
				}else{
					console.log("here1");
					console.log(results1);
					database.myreviews (function(err,results,results1){
						if(err){
							throw err;
						}else{
							console.log(results);
					ejs.renderFile ('views/myaccount.ejs', 
							{title : 'My Account',results:results,results1:results1},
							function(err, results) {
								if (!err) {
									res.end(results);
								}
								// render or error
								else {
									res.end('An error occurred');
									console.log(err);
								}
							});
					console.log("here2");
				}
			},req.session.username,results1,req.session.userid);}
				},req.session.username,req.session.userid);
		}
	},req.param('reviewid'));
	
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
