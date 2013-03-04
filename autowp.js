#!/usr/min/env node

// module dependencies
var http    = require('http');
var request = require('request');
var url     = require('url');
var AdmZip  = require('adm-zip');
var fs      = require('fs');
var program = require('commander');
var mysql   = require('mysql');

// path variables
var zipfile_url = 'http://wordpress.org/latest.zip';
var webroot     = '/Applications/MAMP/htdocs/';

program
  .version('0.0.1')
  .option('-n, --name <app_name>', 'application name *required')
  .option('-d, --db_name <db_name>', 'database name *required')
  .option('-t, --theme_url <theme_url>', 'theme url (defaults to twentytwelve)')

console.log('starting autowp with options: ');
program.parse(process.argv);

// get our application name or die to help()
if(program.name) {
    console.log('  - name: %s', program.name);
} else {
    program.help();

}

// get our database name or die to help()
if(program.db_name) {
    console.log('  - db_name: %s', program.db_name);
} else {
    program.help();
}

// if we have a theme url great, otherwise we'll just use a default wp theme
if(program.theme_url) console.log('  - theme_url: %s', program.theme_url);

// set up our options
var options = {
    host: url.parse(zipfile_url).host,
    port: 80,
    path: url.parse(zipfile_url).pathname
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

        zip.extractAllTo(webroot, true);

        // rename our wordpress directory to the new application name we want
        fs.rename(webroot + 'wordpress', webroot + program.name, function() {
            console.log('.. wordpress directory created'); 
        });

    });
});

// create` the mysql database
var db_conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 8889
});

db_conn.connect(function(err) {
    if(err) throw err;
});

db_conn.query('CREATE DATABASE ' + program.db_name, function(err, results) {
    if (err) throw err;
});
db_conn.end();

console.log('.. database %s created', program.db_name);
