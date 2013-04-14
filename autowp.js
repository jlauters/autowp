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
nconf.load();

nconf.set('chmod_string', 'jonlatuers:admin');
nconf.save();

// wp db user settings
//nconf.set('wp_db_user', 'jon');
//nconf.set('wp_db_pass', 'wppassword');
//nconf.save();

// new config settings
/*nconf.set('app_name', 'jonny_wp');
nconf.set('db_name', 'jonny_wp');
nconf.set('zipfile_url', 'http://wordpress.org/latest.zip');
nconf.set('webroot', '/Applications/MAMP/htdocs/');
nconf.set('hosts_path', '/etc/hosts');
nconf.set('vhosts_path', '/Applications/MAMP/conf/apache/extra/httpd-vhosts.conf');
nconf.save();*/

/*var unzip_result = zipDownload(nconf.get('zipfile_url'), nconf.get('webroot'), function() { console.log("this is just a test callback."); });

// zip file download, mv, inflate
function zipDownload(zipurl, zip_location, callback) {

    console.log('in zipDownload ...');
    console.log('url: ' + zipurl);
    console.log('loc: ' + zip_location);

    var options = {
        host: url.parse(zipurl).host,
        path: url.parse(zipurl).pathname,
        port: 80
    };

    // GET file
    http.get(options, function(response) {

        console.log('.. getting zip');

        var data = [];
        var dataLen = 0;

        response.on('data', function(chunk) {
            data.push(chunk);
            dataLen += chunk.length;
        }).on('end', function() {
            console.log('and were done downloading');

            var buf = new Buffer(dataLen);

            for(var i=0, len = data.length, pos = 0; i < len; i++) {
                data[i].copy(buf, pos);
                pos += data[i].length;
            }

            var zip = new AdmZip(buf);
            var zipEntries = zip.getEntries();

            zip.extractAllTo(zip_url, true);

            console.log('done with zip extract');

            // optional callback after zip extract
            callback();

        });
    });
}*/


// set up our options
var options = {
    host: url.parse(nconf.get('zipfile_url')).host,
    port: 80,
    path: url.parse(nconf.get('zipfile_url')).pathname
};

// download the file
http.get(options, function(res) {
    var data = [], dataLen = 0;

    res.on('data', function(chunk) {
        data.push(chunk);
        dataLen += chunk.length;
    }).on('end', function() {
        var buf = new Buffer(dataLen);

        for(var i=0, len = data.length, pos = 0; i < len; i++) {
            data[i].copy(buf, pos);
            pos += data[i].length;
        }

        var zip = new AdmZip(buf);
        var zipEntries = zip.getEntries();

        zip.extractAllTo(nconf.get('webroot'), true);

        /***************************************
         * Put in callback for WP zip download *
         ***************************************/

        // rename our wordpress directory to the new application name we want
        fs.rename(nconf.get('webroot') + 'wordpress', nconf.get('webroot') + nconf.get('app_name'), function() {
            console.log('.. wordpress directory created'); 
        });

        // change ownership back to normal
        execSync("chown -R " + nconf.get('chmod_string') + " " + nconf.get('webroot') + nconf.get('app_name'));

        // edit wp-config.php to set DB Settings
        var config_file = nconf.get('webroot') + nconf.get('app_name') + "/wp-config.php";
        execSync("cp " + nconf.get('webroot') + nconf.get('app_name') + "/wp-config-sample.php " + config_file);
        console.log('.. created ' + config_file);

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

        // change ownership after we edit them
        execSync("chown " + nconf.get('chmod_string') + " " + config_file);
    });
});

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

// append to vhosts and /etc/hosts
var vhosts  = "<VirtualHost *:80>\n";
    vhosts += "    ServerName " + nconf.get('app_name') + ".local\n";
    vhosts += "    DocumentRoot " + nconf.get('webroot') + nconf.get('app_name') + "/\n";
    vhosts += "</VirtualHost>\n";

fs.appendFile(nconf.get('hosts_path'), '127.0.0.1 ' + nconf.get('app_name') + '.local', function(err) { if (err) throw err; });
fs.appendFile(nconf.get('vhosts_path'), vhosts, function(err) {if (err) throw err; });

console.log('.. entry in %s for %s created', nconf.get('hosts_path'), nconf.get('app_name'));
console.log('.. entry in %s for %s created', nconf.get('vhosts_path'), nconf.get('app_name'));

// bounce apache (MAMP) to let changes take effect
execSync("cd /Applications/MAMP/bin/; sudo ./stopApache.sh");
console.log('.. stopping Apache');
setTimeout(function() {
    execSync("cd /Applications/MAMP/bin/; sudo ./startApache.sh");
    console.log('.. starting Apache');
}, 5000);


