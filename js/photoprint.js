/*
 * Copyright (c) 2009 Hyves <hyves-api@hyves.nl>
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
 * @author Derk Braakman (derk@hyves.nl)
 * @url http://derkmdt.hyves.nl/
 */
	function defaultoneverypage() {
		norightclick();
	}
	function norightclick(e) {
		function message() {
			//alert('you rightclicked');
		}

		function clickIE() {
			if (document.all) {(message());return false;}
		}
		function clickNS(e) {
			if(document.layers||(document.getElementById&&!document.all)) {
			if (e.which==2||e.which==3) {(message());return false;}}
		}
		
		if (document.layers){
			document.captureEvents(Event.MOUSEDOWN);
			document.onmousedown=clickNS;
		} else {
			document.onmouseup=clickNS;
			document.oncontextmenu=clickIE;
		}
	
		document.oncontextmenu=new Function("return false")
	}
	
	function formatdate(mediadate, itype) {
		var dt = new Date(mediadate*1000);
		var sHours = dt.getHours().toString();
		var sMinutes = dt.getMinutes().toString();
		var sHours = (sHours.length == 1) ? "0" + dt.getHours() : dt.getHours();
		var sMinutes = (sMinutes.length == 1) ? "0" + dt.getMinutes() : dt.getMinutes();
		if(itype == 1) { 
			dt = dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear();
		} else if(itype == 2) {			
			dt = sHours + ":" + sMinutes;
		} else {
			dt = dt.getDate() + "-" + dt.getMonth() + "-" + dt.getFullYear() + " " + sHours + ":" + sMinutes;
		}
		
		return dt;
	}
	function imageOver(imagename,sImage) {
		imagename.src = sImage;
	}

	function truncateText(trunc,len) {
		if (trunc.length > len) {
			trunc = trunc.substring(0, len);
			trunc += '...';
		}
		return trunc;
	}

	function printImage(image) {
		var banswer = true;
		//var banswer = confirm("Weet je zeker dat je deze foto wilt afdrukken?")
		if (banswer){
			link = "about:blank";
			var pw = window.open(link, "_new");
			pw.document.open();
			pw.document.write(makeprintpage(image));
			pw.document.close();
			pw.focus();
		}
	}
	
	function makeprintpage(src) {
	// creates temporary pop-up html page for printing an image from the gallery
		string = "<head>\n";
		string += "<link href=\"style.css\" rel=\"stylesheet\" type=\"text/css\" />\n";
		string += "<title>ditisfris printen</title>\n";
		string += "<link rel=\"shortcut icon\" href=\"favicon.ico\">\n";
		string += "<script src=\"js/photoprint.js\" type=\"text/javascript\"></script>\n";
		string += "</head>\n";
		string += "<body>\n";
		string += "<div id=\"printcontent\" class=\"noprint\">\n";
		string += "<div class=\"headerbar\" class=\"noprint\"></div>\n";
		string += "</div>\n";
		string += "<div id=\"printpageholder\">\n";
		string += "<div class=\"printpagephotocrop\">\n";
		string += "<img id=\"printpagephotodiv\" class=\"printpagephoto\" >\n";
		string += "</div>\n";
		string += "<img class=\"printpageoverlay\" src=\"images/scherm/magneet_foto.png\">\n";
		string += "</div>\n";		
		string += "<script type=\"text/javascript\">\n";
		string += "window.onload = function() {adjustphoto('printpagephotodiv', '"+src+"');}\n";
		string += "</script>\n";
		string += "</body>\n";
		string += "</html>\n";
		return string;
	}

	function tracephoto(sName, imagesrc) {
		var objImage = document.getElementById(sName);
		var image = new Image();
		image.onload = function imagesLoaded() {
			objImage.src = image.src;
			var originalWidth = document.getElementById(sName).offsetWidth;
			var originalHeight = document.getElementById(sName).offsetHeight;
			var iScale = originalWidth/originalHeight;
			document.getElementById(sName).width = 370;
			if(document.getElementById(sName).offsetHeight < 280) {
				var iTempHeight = 280 - document.getElementById(sName).offsetHeight;
				document.getElementById(sName).height += iTempHeight;
				document.getElementById(sName).width += iTempHeight;
				document.getElementById(sName).style.marginLeft = -(iTempHeight/2);
			} else {
				var iTempHeight = document.getElementById(sName).height - 280;
				document.getElementById(sName).style.marginTop = -(iTempHeight/4);
			}

		}
		image.src = imagesrc;
		image.onabort = function() {
			alert("failed to connect to get photo");
		};
	}
	
	function adjustphoto(sName, imagesrc) {
		function printstep1() {
			window.opener.focus();
			window.opener.location.href = "confirmprint.html";
			window.print();
			window.close();
		}
		
		var objImage = document.getElementById(sName);
		var image = new Image();
		image.onload = function imagesLoaded() {
			objImage.src = image.src;
			var originalWidth = document.getElementById(sName).offsetWidth;
			var originalHeight = document.getElementById(sName).offsetHeight;
			var iScale = originalWidth/originalHeight;
			document.getElementById(sName).width = 370;
			if(document.getElementById(sName).offsetHeight < 280) {
				var iTempHeight = 280 - document.getElementById(sName).offsetHeight;
				document.getElementById(sName).height += iTempHeight;
				document.getElementById(sName).width += iTempHeight;
				document.getElementById(sName).style.marginLeft = -(iTempHeight/2);
			} else {
				var iTempHeight = document.getElementById(sName).height - 280;
				document.getElementById(sName).style.marginTop = -(iTempHeight/4);
			}
			printstep1();
		}
		image.src = imagesrc;
		image.onabort = function() {
			alert("failed to connect to get photo");
		};
	}	