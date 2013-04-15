// module dependencies
var http     = require('http');
var request  = require('request');
var url      = require('url');
var AdmZip   = require('adm-zip');
var fs       = require('fs');
var nconf    = require('nconf');
var mysql    = require('mysql');
var execSync = require('exec-sync');

// load our config from file
nconf.use('file', {file: 'config.json'});
//nconf.load();
//nconf.save();

// create empty mysql database
var db_conn = mysql.createConnection({
    host: nconf.get('database:host'),
    user: nconf.get('database:user'),
    password: nconf.get('database:password'),
    port: nconf.get('database:port')
});

db_conn.connect(function(err) {
    if(err) throw err;
});

db_conn.query('CREATE DATABASE ' + nconf.get('db_name'), function(err, results) {
    if (err) throw err;
});
db_conn.end();

console.log('.. database %s created', nconf.get('db_name'));

// this callback is for events you wish to occur
// after the wordpress zip file has been downloaded
// unzipped and moved into the webroot directory
var download_callback = function() {

   // rename our wordpress directory to the new application name we want
   fs.rename(nconf.get('webroot') + 'wordpress', nconf.get('webroot') + nconf.get('app_name'), function() {
       console.log('renamed wordpress directory to ' + nconf.get('app_name')); 
   });

   // change ownership back to normal
   execSync("chown -R " + nconf.get('chmod_string') + " " + nconf.get('webroot') + nconf.get('app_name'));

   // append new line to hosts file
   fs.appendFile(nconf.get('hosts_path'), '127.0.0.1 ' + nconf.get('app_name') + '.local', function(err) { if (err) {throw err;} });
   console.log('.. entry in %s for %s created', nconf.get('hosts_path'), nconf.get('app_name'));

   // append to vhosts file
   var vhosts  = "<VirtualHost *:80>\n";
       vhosts += "    ServerName " + nconf.get('app_name') + ".local\n";
       vhosts += "    DocumentRoot " + nconf.get('webroot') + nconf.get('app_name') + "/\n";
       vhosts += "</VirtualHost>\n";

   fs.appendFile(nconf.get('vhosts_path'), vhosts, function(err) {if (err) {throw err;} });
   console.log('.. entry in %s for %s created', nconf.get('vhosts_path'), nconf.get('app_name'));

   // append to functions.php
   fs.readFile('functions_additions.php', function(err, data) {
       if(err) { return console.log(err); }

       fs.appendFile(nconf.get('webroot') + nconf.get('app_name') + nconf.get('functions_path'), data, function(err) { if (err) {throw err;} });
   });   

   // edit wp-config.php to set DB Settings
   var config_file = nconf.get('webroot') + nconf.get('app_name') + "/wp-config.php";
   execSync("cp " + nconf.get('webroot') + nconf.get('app_name') + "/wp-config-sample.php " + config_file);

   fs.readFile(config_file, 'utf8', function(err, data) {
       if(err) {
           return console.log(err);
       }

       var result = data.replace(/database_name_here/g, nconf.get('db_name'));
           result = result.replace(/username_here/g, nconf.get('wp_db_user'));
           result = result.replace(/password_here/g, nconf.get('wp_db_pass'));

       fs.writeFile(config_file, result, 'utf8', function(err) {
           if(err) return console.log(err);
       });
   });
   execSync("chown " + nconf.get('chmod_string') + " " + config_file);
   console.log('wp-config updated with DB settings ...');

   // bounce apache (MAMP) to let changes take effect
   console.log('bouncing webserver ...');
   execSync("cd /Applications/MAMP/bin/; sudo ./stopApache.sh");

   setTimeout(function() {
       execSync("cd /Applications/MAMP/bin/; sudo ./startApache.sh");
       console.log('... webserver bounce complete.');
   }, 5000);
}

// download wordpress
// passing the wp.com url for latest download
// our local webroot
// a callback function of items after download.
var unzip_result = zipDownload(nconf.get('zipfile_url'), nconf.get('webroot'), download_callback);

// zip file download, mv, inflate
function zipDownload(zipurl, zip_location, callback) {

    var options = {
        host: url.parse(zipurl).host,
        path: url.parse(zipurl).pathname,
        port: 80
    };

    http.get(options, function(response) {

        var data = [];
        var dataLen = 0;

        response.on('data', function(chunk) {
            data.push(chunk);
            dataLen += chunk.length;
        }).on('end', function() {
            console.log('zip download has been completed.');

            var buf = new Buffer(dataLen);
            for(var i=0, len = data.length, pos = 0; i < len; i++) {
                data[i].copy(buf, pos);
                pos += data[i].length;
            }

            var zip = new AdmZip(buf);
            var zipEntries = zip.getEntries();

            zip.extractAllTo(zip_location, true);

            console.log('zip extraction to' + zip_location + ' complete ..');

            // optional callback after zip extract
            callback();
        });
    });
}

console.log('done with zipdownload function');
console.log('autowp script complete ...');

