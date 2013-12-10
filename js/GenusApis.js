/*
 * Copyright (c) 2008 Kilian Marjew <kilian@marjew.nl>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 *
 * @author Kilian Marjew (kilian@marjew.nl)
 * @url http://hyvapi.marjew.nl/
 */
var _GenusApisUtil = new GenusApisUtil;
var _OAuthUtil = new OAuthUtil;

function GenusApis(oOAuthConsumer, exceptionHandler) {
	this.oOAuthConsumer = oOAuthConsumer;
	this.exceptionHandler = exceptionHandler;
	this.DEFAULT_HA_VERSION = 'experimental';
	this.DEFAULT_HA_FORMAT = 'json';
	this.DEFAULT_HA_FANCYLAYOUT = 'false';
	this.DEFAULT_HA_RESPONSECODE_ALWAYS_200 = 'true';
	this.DEFAULT_OAUTH_SIGNATURE_METHOD = "HMAC-SHA1";
	this.HTTP_TYPE_GET = 'GET';
	this.API_URL = "http://data.hyves-api.nl/";
	this.AUTHORIZE_URL = "http://www.hyves.nl/api/authorize/";

	this.timestampLastMethod = null;
	this.nonce = null;
}

GenusApis.prototype.doMethod = function(ha_method, sParams, callback, oOAuthToken) {
	var callbackId = _GenusApisUtil.getNextJsonpCallbackIdentifier();
	var sDefaultParams = {
		oauth_consumer_key : this.oOAuthConsumer.getKey(),
		oauth_timestamp : this.getOAuthTimestamp(),
		oauth_nonce : this.getOAuthNonce(),
		oauth_signature_method : this.DEFAULT_OAUTH_SIGNATURE_METHOD,
		ha_method : ha_method,
		ha_version : this.DEFAULT_HA_VERSION,
		ha_format : this.DEFAULT_HA_FORMAT,
		ha_fancylayout : this.DEFAULT_HA_FANCYLAYOUT,
		ha_callback : callbackId,
		ha_responsecode_always_200 : this.DEFAULT_HA_RESPONSECODE_ALWAYS_200
	};
	var oauth_consumer_secret = this.oOAuthConsumer.getSecret(); 
		var oauth_token_secret = "";
	if (oOAuthToken !== null && oOAuthToken !== undefined)
	{
		sDefaultParams["oauth_token"] = oOAuthToken.getKey();
		oauth_token_secret = oOAuthToken.getSecret();
	}
	for (x in sParams) {
		sDefaultParams[x] = sParams[x];
	}
	sParams = sDefaultParams;
	sParams["oauth_signature"] = _GenusApisUtil.calculateOAuthSignature(this.HTTP_TYPE_GET, this.API_URL, sParams, oauth_consumer_secret, oauth_token_secret);
	var params = _OAuthUtil.normalizeKeyValueParameters(sParams);
	var url = this.API_URL + "?" + params;
	var self = this;
	_GenusApisUtil.doJsonpCall(url, callback, self);
}

GenusApis.prototype.retrieveRequesttoken = function(aMethods, expirationtype, callback){
	if (expirationtype === null || expirationtype === undefined) {
		var expirationtype = 'default';
	}
	var tempCallback = function(response) {
		var oOAuthRequestToken = new OAuthRequestToken(response["oauth_token"], response["oauth_token_secret"]);
		callback(oOAuthRequestToken);
	}
	this.doMethod("auth.requesttoken", {methods : aMethods.join(','), expirationtype : expirationtype}, tempCallback);
}

GenusApis.prototype.getAuthorizeUrl = function(oOAuthRequestToken, callback){
	var url = this.AUTHORIZE_URL + "?oauth_token=" + oOAuthRequestToken.getKey();
	if (callback !== null && callback !== undefined) {
		url += "&oauth_callback=" + _OAuthUtil.urlencodeRFC3986_UTF8(callback);
	}
	return url;
}

GenusApis.prototype.retrieveAccesstoken = function(oOAuthRequestToken, callback){
	var tempCallback = function(response) {
		var oOAuthAccessToken = new OAuthAccessToken(response["oauth_token"], response["oauth_token_secret"], response["userid"], response["methods"], response["expiredate"]);
		callback(oOAuthAccessToken);
	}
	this.doMethod("auth.accesstoken", { }, tempCallback, oOAuthRequestToken);
}

GenusApis.prototype.checkForErrors = function(dataObject){
	if (typeof(dataObject) !== "object" || dataObject["error_code"]) {
		throw new HyvesApiException(dataObject["error_message"], dataObject["error_code"], dataObject);
	}
}

GenusApis.prototype.handleException = function(e){
	this.exceptionHandler(e);
}
	
GenusApis.prototype.getOAuthTimestamp = function(){
	var timestamp = Math.floor(new Date().valueOf()/1000);
	if (this.timestampLastMethod == timestamp) {
		this.nonce++;
	} else {
		this.timestampLastMethod = timestamp;
		this.nonce = 0;
	}
	return this.timestampLastMethod;
}
	
GenusApis.prototype.getOAuthNonce = function(){
	var rand = Math.ceil(100000*Math.random());
	return this.nonce + "_" + rand;
}


var _cbId = 0;
var _cb = {};

function GenusApisUtil() {
}

GenusApisUtil.prototype.doJsonpCall = function(url, callback, caller){
	var element = document.createElement("script");
	var callbackId = _cbId;
	var scriptId = "_genusapis_callback_" + callbackId;
	element.id = scriptId;
	element.src = url;
	_cb["o"+callbackId] = function(response) {
		try {
			caller.checkForErrors(response);
		}
		catch(e) {
			caller.handleException(e);
			return;
		}
		try {
			callback(response);
			delete _cb["o"+callbackId];
			var el = document.getElementById(scriptId);
			el.parentNode.removeChild(el);
		}
		catch(e) {
			var exception = new GeneralException(e, null);
			caller.handleException(exception);
			return;
		}
	}
	var head = document.getElementsByTagName("head").item(0);
	head.appendChild(element);
}

GenusApisUtil.prototype.getNextJsonpCallbackIdentifier = function(){
	_cbId++;
	return "_cb.o" + _cbId;
}

GenusApisUtil.prototype.calculateOAuthSignature = function(http_method, uri, sVar, consumersecret, oauth_token_secret) {
	var params = _OAuthUtil.normalizeKeyValueParameters(sVar);
	var basestring = _OAuthUtil.generateBaseString(http_method, uri, params);
	return _OAuthUtil.calculateHMACSHA1Signature(basestring, consumersecret, oauth_token_secret);
}


function OAuthBase(key, secret) {
	this.key = key;
	this.secret = secret;
}

OAuthBase.prototype.getKey = function(){
	return this.key;
}

OAuthBase.prototype.getSecret = function(){
	return this.secret;
}

function OAuthConsumer(key, secret) {
	this.base = OAuthBase;
	this.base(key, secret);
}
OAuthConsumer.prototype = new OAuthBase;

function OAuthRequestToken(key, secret) {
	this.base = OAuthBase;
	this.base(key, secret);
}
OAuthRequestToken.prototype = new OAuthBase;

function OAuthAccessToken(key, secret, userid, methods, expiredate) {
	this.base = OAuthBase;
	this.base(key, secret);
	this.userid = userid;
	this.methods = methods;
	this.expiredate = expiredate;
}
OAuthAccessToken.prototype = new OAuthBase;

OAuthAccessToken.prototype.getUserid = function(){
	return this.userid;
}

OAuthAccessToken.prototype.getMethods = function(){
	return this.methods;
}

OAuthAccessToken.prototype.getExpiredate = function(){
	return this.expiredate;
}

function OAuthUtil() {
}

OAuthUtil.prototype.normalizeParameters = function(aParam) {
	var aEncodedVars = new Array();
	for (var i = 0; i < aParam.length; i++) {
		aEncodedVars[aEncodedVars.length] = this.urlencodeRFC3986_UTF8(aParam[i]["key"]) + "=" + this.urlencodeRFC3986_UTF8(aParam[i]["value"]);
	}
	aEncodedVars.sort();
	return aEncodedVars.join('&');
}

OAuthUtil.prototype.normalizeKeyValueParameters = function(sParam) {
	var aParam = new Array();
	for (key in sParam) {
		aParam[aParam.length] = { key : key, value : sParam[key] };
	}
	return this.normalizeParameters(aParam);
}

OAuthUtil.prototype.urlencodeRFC3986_UTF8 = function(string) {
	s = encodeURIComponent(string);
        s = s.replace("!", "%21", "g");
        s = s.replace("*", "%2A", "g");
        s = s.replace("'", "%27", "g");
        s = s.replace("(", "%28", "g");
        s = s.replace(")", "%29", "g");
	return s;
}

OAuthUtil.prototype.generateBaseString = function(http_method, uri, params) {
	var aBasestring = new Array(
		this.urlencodeRFC3986_UTF8(http_method),
		this.urlencodeRFC3986_UTF8(uri),
		this.urlencodeRFC3986_UTF8(params)
	);
	return aBasestring.join('&');
}

OAuthUtil.prototype.calculateHMACSHA1Signature = function(basestring, consumersecret, tokensecret) {
	var aKey = new Array(
		this.urlencodeRFC3986_UTF8(consumersecret),
		this.urlencodeRFC3986_UTF8(tokensecret)
	);
	var key = aKey.join('&');
	var signature = encode64(str_hmac_sha1(key, basestring));
	return signature;
}

function GeneralException(message, code) {
	this.message = message;
	this.code = code;
}

GeneralException.prototype.getCode = function(){
	return this.code;
}

GeneralException.prototype.getMessage = function(){
	return this.message;
}

GeneralException.prototype.getType = function(){
	return 'GeneralException';
}

function HyvesApiException(message, code, response) {
	this.base = GeneralException;
	this.base(message, code);
	this.response = response;
}
HyvesApiException.prototype = new GeneralException;

HyvesApiException.prototype.getResponse = function(){
	return this.response;
}

HyvesApiException.prototype.getType = function(){
	return 'HyvesApiException';
}



// Libraries

// Hmac SHA1
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as definjson to htmled
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1(key, data)
{
  var bkey = str2binb(key);
  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
  return core_sha1(opad.concat(hash), 512 + 160);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words
 * In 8-bit function, characters >255 have their hi-byte silently ignored.
 */
function str2binb(str)
{
  var bin = Array();
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < str.length * chrsz; i += chrsz)
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
  return bin;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2str(bin)
{
  var str = "";
  var mask = (1 << chrsz) - 1;
  for(var i = 0; i < bin.length * 32; i += chrsz)
    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
  return str;
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex(binarray)
{
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i++)
  {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
  }
  return str;
}

/*
 * Convert an array of big-endian words to a base-64 string
 */
function binb2b64(binarray)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var str = "";
  for(var i = 0; i < binarray.length * 4; i += 3)
  {
    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
    }
  }
  return str;
}

// Base 64
// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

function encode64(input) {
   var output = "";
   var chr1, chr2, chr3;
   var enc1, enc2, enc3, enc4;
   var i = 0;

   do {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
         enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
         enc4 = 64;
      }

      output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + 
         keyStr.charAt(enc3) + keyStr.charAt(enc4);
   } while (i < input.length);
   
   return output;
}

function decode64(input) {
   var output = "";
   var chr1, chr2, chr3;
   var enc1, enc2, enc3, enc4;
   var i = 0;

   // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

   do {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
         output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
         output = output + String.fromCharCode(chr3);
      }
   } while (i < input.length);

   return output;
}