var assert = require('assert');
var should = require('should');
var path = require('path');
var gulp = require('gulp');
var Vinyl = require('vinyl');
var bookmarklet = require('../index');
var bookmarkletGen = require('bookmarklet-babel7');
var netscape = require('netscape-bookmarks');

describe('gulp-bookmarklet', function() {
    var fakeFile, fakeFile2, code1, code2;

    function fixtures (glob) {
        return path.join(__dirname, 'fixtures', glob);
    }

    function bookmarkletCode(contents) {
        var data = bookmarkletGen.parseFile(contents.toString());
        return bookmarkletGen.convert(data.code, data.options);
    }

    beforeEach(function() {
        fakeFile = new Vinyl({
            contents: Buffer.from('alert("Hello world!");'),
            cwd: __dirname,
            base: path.join(__dirname),
            path: path.join(__dirname, 'fakeFile.js')
        });
        fakeFile2 = new Vinyl({
            contents: Buffer.from('alert("Hello world 2!");'),
            cwd: __dirname,
            base: path.join(__dirname),
            path: path.join(__dirname, 'fakeFile2.js')
        });
        code = bookmarkletCode('alert("Hello world!");');
        code2 = bookmarkletCode('alert("Hello world 2!");');
    });

    it('can minify source to format js', function(done) {
        var stream = bookmarklet({
            format: 'js'
        });

        stream.on('data', function(newFile) {
            if (newFile == fakeFile) {
                assert.equal(code, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile.min.js'), newFile.path);
            } else {
                assert.equal(code2, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile2.min.js'), newFile.path);
            }
        });

        stream.on('end', function() {
            done();
        });

        stream.write(fakeFile);
        stream.write(fakeFile2);
        stream.end();
    });

    it('can minify source to format html', function(done) {
        var stream = bookmarklet({
            format: 'html'
        }),
        bookmark = netscape({
            'fakeFile': code
        }),
        bookmark2 = netscape({
            'fakeFile2': code2
        });

        stream.on('data', function(newFile) {
            if (newFile == fakeFile) {
                assert.equal(bookmark, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile.html'), newFile.path);
            } else {
                assert.equal(bookmark2, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile2.html'), newFile.path);
            }
        });

        stream.on('end', function() {
            done();
        });

        stream.write(fakeFile);
        stream.write(fakeFile2);
        stream.end();
    });

    it('can minify source to format htmlsingle with default name', function(done) {
        var stream = bookmarklet({
            format: 'htmlsingle'
        }),
        bookmark = netscape({
            'fakeFile': code,
            'fakeFile2': code2
        });

        stream.on('data', function(newFile) {
            assert.equal(bookmark, newFile.contents);
            assert.equal(path.join(__dirname, 'bookmarklets.html'), newFile.path);
        });

        stream.on('end', function() {
            done();
        });

        stream.write(fakeFile);
        stream.write(fakeFile2);
        stream.end();
    });

    it('can minify source to format htmlsingle with custom name', function(done) {
        var stream = bookmarklet({
            format: 'htmlsingle',
            file: 'awesome.html'
        }),
        bookmark = netscape({
            'fakeFile': code,
            'fakeFile2': code2
        });

        stream.on('data', function(newFile) {
            assert.equal(bookmark, newFile.contents);
            assert.equal(path.join(__dirname, 'awesome.html'), newFile.path);
        });

        stream.on('end', function() {
            done();
        });

        stream.write(fakeFile);
        stream.write(fakeFile2);
        stream.end();
    });

    it('will throw PluginError for invalid format', function() {
        (function() {
            bookmarklet({
                format: 'taco'
            });
        }).should.throw("Invalid format 'taco' - Must be one of ['js', 'html', 'htmlsingle']");
    });

    it('will default to format js', function(done) {
        var stream = bookmarklet();

        stream.on('data', function(newFile) {
            if (newFile == fakeFile) {
                assert.equal(code, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile.min.js'), newFile.path);
            } else {
                assert.equal(code2, newFile.contents);
                assert.equal(path.join(__dirname, 'fakeFile2.min.js'), newFile.path);
            }
        });

        stream.on('end', function() {
            done();
        });

        stream.write(fakeFile);
        stream.write(fakeFile2);
        stream.end();
    });

    it('will emit error on streamed file', function(done) {
        gulp.src(fixtures('*'), { buffer: false })
            .pipe(bookmarklet())
            .on('error', function(err) {
                assert.equal('Streams are not supported!', err.message);
                done();
            });
    });
});
