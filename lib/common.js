var _gaq = _gaq || [];
var pluginUrl = 'http://www.google-analytics.com/plugins/ga/inpage_linkid.js';
_gaq.push(['_require', 'inpage_linkid', pluginUrl]);
_gaq.push(['_setAccount', 'UA-37169005-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

(function() {

    if (!window.jQuery) {
        var jq = document.createElement('script');
        jq.type = 'text/javascript';
        jq.async = true;
        jq.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js'
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(jq, s);

        jq.onreadystatechange = jq.onload = ready_go;
    } else ready_go();

})();
