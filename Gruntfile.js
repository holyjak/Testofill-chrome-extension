// NOTE: Only used for testing now (6/2024) [if that actually works]
module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: ['Gruntfile.js',
      'src/extension/*.js',
      ,'src/extension/content/*.js',
      'src/extension/shared/*.js',
      ],
      options: {
        esversion: 6
        //maxlen: 80,
        //quotmark: 'single'
      }
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test/*.js'] }
    },
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
        tasks: ['development']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('development', ['jshint', 'simplemocha']);
  grunt.registerTask('default', ['jshint', 'simplemocha']);

};
