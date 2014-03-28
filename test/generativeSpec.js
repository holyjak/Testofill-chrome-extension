// TODO import underscore
var expect = require('chai').expect, Chance = require('chance');

GLOBAL.chance = new Chance();
GLOBAL._ = require('underscore');

var gen = require('../src/content/generative.js');

describe('generative should parse', function () {
    it('simple literal', function () {
        expect(gen.parseGenExpr(["some string literal"])).to.equal('some string literal');
    });

    it('simple 2 elm literal to concatenated string', function () {
        expect(gen.parseGenExpr(["1","2"])).to.equal('12');
    });
    it('simple fn', function () {
        expect(gen.parseGenExpr(['$integer'])).to.match(/^(-)?\d+$/);
    });

//     it('fn with arguments', function () { // TODO to non-array arg
//         expect(gen.parseGenExpr([["chance.pick", ["one"]]])).to.equal('one');
//     });

    it('nested fn (1 level only)', function () {
        expect(gen.parseGenExpr(["$natural", {"min": ["$natural"]}])).to.match(/^\d+$/);
    });

    it('simple fn with array arg', function () {
        expect(gen.parseGenExpr(["$pick", ["one"]])).to.equal("one");
    });

//     it('fn with non-string (int) array argument', function () {
//         expect(gen.parseGenExpr(["chance.pick", [1])).to.equal(1);
//     });

//     it('fn with non-string (bool) array argument', function () {
//         expect(gen.parseGenExpr(["chance.pick", [false])).to.equal(false);
//     });

    it('complex mixed fn and literal expression', function () {
        expect(gen.parseGenExpr(["+47", ["$natural", {"min": 10000000,"max":99999999}]])).to.
          match(/^\+47\d{8}$/);
    });

});
