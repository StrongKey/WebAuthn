var isIE = /*@cc_on!@*/false || !!document.documentMode;
var hasCredentials = !!window.navigator.credentials;
var hasClasses = true;

try {
    eval("class ThisClassRequiresES6 {}");
}
catch (e) {
    hasClasses = false;
}

console.log('ie: ' + isIE + ', credentials: ' + hasCredentials + ', classes: ' + hasClasses);
var supportedBrowser = !isIE && hasCredentials && hasClasses;

if (!supportedBrowser) {
    $('.loading-spinner').hide();
    $('#unsupportedBrowser').css('display', 'block');
}
