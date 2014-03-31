
// var generateFns = {
//   "chance.natural": [chance.natural, chance],
//   "chance.integer": [chance.integer, chance],
//   "chance.bool": [chance.bool, chance],
//   "chance.character": [chance.character, chance],
//   "chance.pick": [chance.pick, chance]
// };

var chanceFns = _.chain(chance)
  .functions()
  .map(function(name){
    return ['$' + name, [chance[name], chance]];
  })
  .object()
  .value();

var generativeFns = {
  'concat': [function() {return _.reduce(arguments, function(acc,str){return acc.concat(str);}, "");}, null],
  'identity': [function(v) {return v;}, null]
};

var generateFns = _.extend({}, chanceFns, generativeFns);

function parseTopGenExpr(expr) {

  var result = parseGenExpr(expr);

  if (_.isArray(result)) {
    result = _.reduce(result, function(acc,str){return acc.concat(str);}, "");
  }

  return result;
}

function parseGenExpr(expr) {

  // Is this a fn call?
  var maybeFn = isFnCall(expr);
  if (maybeFn) {
    var name = expr[0];
    return parseGenFn(maybeFn, _.rest(expr));
  }

  // Other, non-fn call
  return parseGenVal(expr);

}

function isFnCall(expr) {
  if (_.isArray(expr) && !_.isEmpty(expr) && _.isString(expr[0])) {
    var maybeName = expr[0];
    var maybeFn = generateFns[maybeName];
    if (maybeFn) {
      return maybeFn;
    }
  }
  return false;
}

/**
* Note: Nested arrays parsed too; literal array not parsed: {array: [...]}
*/
function parseGenFn(fn, args) {

  var argsParsed = _.chain(args)
  .map(function(e){
    // nested fn call?
    if (_.isArray(e)) return parseGenExpr(e); // array but not fn call
    // literal array?
    //if (_.isObject(e) && _.has(e, 'array') && _.keys(e).length === 1 ) return e.array;
    // parsed nested (1 level only)
    if (_.isObject(e)){
      return _.chain(e).pairs().map(function(nameVal){
        var val = nameVal[1];
        var maybeFn = isFnCall(val);
        if (maybeFn) {
          val = parseGenFn(maybeFn, _.rest(val));
        }
        return [nameVal[0], val];
      })
      .object().value();
    }
    return e;
  })
  .value();

  return fn[0].apply(fn[1], argsParsed);
}

/** Parse non-fn call: literal array or literal value */
function parseGenVal(expr) {
  return _.chain(expr)
  .map(function(e){
    if (_.isString(e)) return e;
    if (_.isArray(e)) return parseGenExpr(e); // array but not fn call
    throw {expr: expr, e: e, msg: "Cannot parse, only supports string/array here, got " + (typeof e)};
  })
  .value();
}

// Node.js - testing
if (typeof exports !== 'undefined') exports.parseGenExpr = parseTopGenExpr;
