module.exports = function(grunt) {

    // Project config.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        }
    });

    // load plugin that performs "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // default tasks.
    grunt.registerTask('default', ['uglify']);
}
