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

    var once = false;

    function ready_go() {
        if (once) return;
        once = true;
        $(document).ready(function () {
            if (!$('#title-header').length) {
                $('div.page-header').replaceWith($('<h2>').text($('h1').text()));
                $('div.container').prepend($('<div>').attr('id',"title-header").addClass("row")
                    .append($('<div>').addClass("span8")
                        .append($('<div>').addClass("page-header")
                            .append($('<a>').attr('id',"link-title").attr('href',"index.html")
                                .append($('<h1>').attr('id',"title").text('JSON Schema org.'))))));
            }
            if (!window.github)
                $.getScript('lib/fat-grabby-hands.js', github_go);
            else
                github_go();
        });
    }

    function github_go() {
        var sidebar = $('<div>'),
            lst = $('<ul>'),
            memb =  $('<div>'),
            stats = $('<div>');
        $('body').prepend(sidebar);
        github.orgs.members('json-schema', function(o){
            $(o).each(function () {
                github.users(this.login, function(u) {
                    if (u.name) uname = u.name;
                    else uname = u.login;
                    lst.append($('<li>')
                        .append($('<a>').attr('href',u.html_url)
                        .append($('<img>').addClass('avatar').attr('src',u.avatar_url))
                        .append(uname)));
                });
            });
            memb.addClass('hall-of-fame')
                .append($('<h3>').text('Hall of fame'))
                .append(lst);
        });
        sidebar.addClass('side-bar').append(memb).append(stats);
        github.repos('json-schema','json-schema',function (o) {
            stats.append($('<h3>').text('Statistics'))
                .append($('<ul>')
                .append($('<li>').text(o.watchers)
                .prepend($('<strong>').text('Watchers: ')))
                .append($('<li>').text(o.network_count)
                .prepend($('<strong>').text('Network: ')))
                .append($('<li>').text(o.forks)
                .prepend($('<strong>').text('Forks: ')))
                .append($('<li>').text(o.open_issues)
                .prepend($('<strong>').text('Issues: ')))
            );
        });
        var web = $('<ul>'),
            nxt = $('<ul>');
        github.repos.branches('json-schema','json-schema', function (b) {
            $(b).each(function () {
                if (this.name == 'gh-pages')
                    commit_log(web, this.commit.sha);
                else if (this.name == 'next')
                    commit_log(nxt, this.commit.sha);
            });
            sidebar.append($('<div>').addClass('repo-updates')
                .append($('<h3>').text('Latest updates'))
                .append($('<h4>').text('Website'))
                .append(web)
                .append($('<h4>').text('Specifications'))
                .append(nxt));
        });

    }

    function commit_log(lst, sha) {
        github.repos.commitsSha('json-schema','json-schema', sha, function (cw) {
            var whn = cw.commit.committer.date.split('T')[0].split('-').slice(1).join('/'),
                auth = cw.committer.login!=cw.author.login && ' for '+cw.author.login || '';
            lst.append($('<li>').text('by '+cw.committer.login+auth))
                .append($('<li>').text('on '+whn+' +'+cw.stats.additions+'/-'+cw.stats.deletions))
                .append($('<li>').append($('<i>').text(cw.commit.message)));
        });
    }
    if (!window.jQuery) {
        var jq = document.createElement('script');
        jq.type = 'text/javascript';
        jq.async = true;
        jq.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js'
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(jq, s);

        jq.onreadystatechange = jq.onload = ready_go;
    } else ready_go();

})();
