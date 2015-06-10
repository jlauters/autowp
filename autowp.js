// module dependencies
var http          = require('http'),
    request       = require('request'),
    path          = require('path'),
    url           = require('url'),
    fs            = require('fs'),
    targz         = require('tar.gz'),
    nconf         = require('nconf'),
    mysql         = require('mysql'),
    child_process = require('child_process'); 

global.appRoot = path.resolve(__dirname);

// Native Node.js execSync
function execSync(command) {

    console.log('in execSync. Command: ');
    console.log(command);

    // Run passed in command in subshell
    child_process.exec(command + ' 2>&1 1>output && echo done! > done');

    // Block the event loop until this command has executed.
    while(!fs.existsSync('done')) {
        // do nothing
    }

    // Read output
    var output = fs.readFileSync('output');

    // Delete temp files
    fs.unlinkSync('output');
    fs.unlinkSync('done');

    return output;
}

// load our config from file
nconf.use('file', {file: 'config.json'});

// mysql connection string
var db_conn = mysql.createConnection({
    host: nconf.get('database:host'),
    user: nconf.get('database:user'),
    password: nconf.get('database:password'),
    port: nconf.get('database:port')
});

// Mysql Connect. Create WP Shell DB. Disconnect
db_conn.connect(function(err) { if(err) throw err; });
db_conn.query('CREATE DATABASE IF NOT EXISTS ' + nconf.get('db_name'), function(err, results) { 
    if(err) { 
        throw err;
    } else { 
        console.log('... database %s created', nconf.get('db_name'));
    }
});
db_conn.end();

// this callback is for events you wish to occur
// after the wordpress zip file has been downloaded
// unzipped and moved into the webroot directory
var download_callback = function() {

   console.log('in download Callback ...');

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


   // All Done.
   console.log('done with zipdownload function');
   console.log('autowp script complete ...');

}


// zip file download, mv, inflate
function zipDownload(zipurl, zip_location, callback) {

    
    var r = request.get(zipurl).pipe(fs.createWriteStream('latest.tar.gz'));
    r.on("finish", function() {
        console.log('file to uncompress: ' + appRoot + '/latest.tar.gz');
     
        var compressed_file = appRoot + '/latest.tar.gz';
        var dest = zip_location;

        var uncompress = new targz().extract(compressed_file, dest, function(err) {
            if(err) { console.log("Extraction Error: " + err); }
            else {
                console.log('wordpress extraction to: ' + zip_location + nconf.get('app_name') + ' complete ...');
                callback();
            }
        });
    });
}

// download wordpress
// passing the wp.com url for latest download
// our local webroot
// a callback function of items after download.
var unzip_result = zipDownload(nconf.get('zipfile_url'), nconf.get('webroot'), download_callback);



