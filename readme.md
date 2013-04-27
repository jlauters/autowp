AutoWP
----------

fast configuration for automated wordpress instalation and bootstrapping of various common functionalities

specify a config.json file with key value pairs for common tasks after the "famous 5 minute install"

Sample config.json
------------------------

```
{
  "webroot": "/path/to/local/webroot",
  "app_name": "APP_NAME",
  "db_name": "APP_DB_NAME",
  "database": {
       "host": "localhost",
       "port": 1234,
       "user": "root",
       "password": "root"
  },
  "zipfile_url": "http://wordress.org/latest.zip",
  "hosts_path": "/path/to/hosts/fil",
  "vhosts_path": "/path/to/apache/vhosts",
  "wp_db_user": "WP_DB_USER",
  "wp_db_pass": "WP_DB_PASS",
  "chmod_string": "foo:bar",
  "functions_path": "/wp-content/themes/twentytwelve/functions.php"
}
```
