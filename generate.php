<?php

header("Content-Type: text/plain");

$menu = array(
	"about" => "index.html",
	"docs" => "documentation.html",
	"examples" => "examples.html",
	"software" => "implementations.html"
);

$pages = array(
	"index.html" => array(
		"content" => "content/index.html",
		"menu" => "about",
		"pageTitle" => "JSON Schema and Hyper-Schema"
	),
	"documentation.html" => array(
		"content" => "content/documentation.html",
		"menu" => "docs",
		"pageTitle" => "JSON Schema - Documentation"
	),
	"implementations.html" => array(
		"content" => "content/implementations.html",
		"menu" => "software",
		"pageTitle" => "JSON Schema Software"
	),
	"examples.html" => array(
		"content" => "content/examples.html",
		"menu" => "examples",
		"pageTitle" => "JSON Schema Examples"
	),
	"example1.html" => array(
		"content" => "content/example1.html",
		"menu" => "examples",
		"pageTitle" => "JSON Schema - Simple Example"
	),
	"example2.html" => array(
		"content" => "content/example2.html",
		"menu" => "examples",
		"pageTitle" => "JSON Schema - Advanced Example"
	)
);

foreach ($pages as $outputFile => $pageSpec) {
	echo "Rendering: $outputFile:\n";
	ob_start();
?>

<html>
	<head>
		<title><?php echo $pageSpec['pageTitle']; ?></title>
		<link rel="stylesheet" href="lib/css/bootstrap.min.css"></link>
		<link rel="stylesheet" href="lib/css/bootstrap-theme.min.css"></link>
		<link rel="stylesheet" href="lib/css/green-theme.css"></link>
		<link rel="stylesheet" href="lib/css/json-highlight.css"></link>
		<script type="text/javascript">
			var _gaq = _gaq || [];
			var pluginUrl = '//www.google-analytics.com/plugins/ga/inpage_linkid.js';
			_gaq.push(['_require', 'inpage_linkid', pluginUrl]);
			_gaq.push(['_setAccount', 'UA-37169005-1']);
			_gaq.push(['_trackPageview']);

			(function() {
				var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
				ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
				var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
			})();
		</script>
	</head>
	  <body role="document">

			<nav class="navbar navbar-inverse navbar-fixed-top">
	      <div class="container">
	        <div class="navbar-header">
	          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
	            <span class="glyphicon glyphicon-menu-hamburger"></span>
	          </button>
	          <a class="navbar-brand" href="index.html">
							<span class="logo">
								<span class="json-site">json</span><span class="schema-site">schema</span>
							</span>
						</a>
	        </div>
	        <div id="navbar" class="navbar-collapse collapse navbar-right">
	          <ul class="nav navbar-nav">
							<?php
								foreach ($menu as $text => $target) {
									$activeClass = ($text == $pageSpec['menu']) ? "active":"";
									echo "<li class=\"$activeClass\"><a href=\"$target\">$text</a></li>";
								}
							?>
	          </ul>
	        </div><!--/.nav-collapse -->
	      </div>
	    </nav>

      <div class="container" role="main">
				<?php
					readfile($pageSpec['content']);
				?>
			</div>

		<footer class="footer">
      <div class="container">
        <p class="text-muted">The home of JSON Schema.</p>
      </div>
    </footer>

		<script src="lib/js/jquery.min.js"></script>
		<script src="lib/js/bootstrap.min.js"></script>
		<script src="lib/js/json-highlight.js"></script>
		<script src="lib/js/show-hide.js"></script>
	</body>
</html>
<?php
	$fullPage = ob_get_clean();
	if (!file_put_contents($outputFile, $fullPage)) {
		echo "\terror setting file contents\n";
 	} else {
		echo "\tsuccess\n";
 	}
}
echo "done.\n";
?>
