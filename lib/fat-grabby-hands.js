var github = (function(GithubClient){

  return new GithubClient('70ce31a2bc8adcf866ac7a50ae75eeea819640df');

})(function(global, githubRoutes){
  "use strict";

  // ###########################
  // ### Helpers and globals ###
  // ###########################

  var FP = Function.prototype,
      AP = Array.prototype,
      OP = Object.prototype;

  var bindbind   = FP.bind.bind(FP.bind),
      callbind   = bindbind(FP.bind),
      applybind  = bindbind(FP.apply);

  var has        = callbind(OP.hasOwnProperty),
      slice      = callbind(AP.slice),
      flatten    = applybind(AP.concat, []);

  var filter_    = AP.filter,
      map_       = AP.map,
      push_      = AP.push,
      slice_     = AP.slice;


  function decorate(o){
    var b, c, d;
    for (var i=1; b = arguments[i]; i++) {
      for (c in b) {
        if (d = Object.getOwnPropertyDescriptor(b, c)) {
          if (d.get || d.set) {
            Object.defineProperty(o, c, d);
          } else {
            o[c] = d.value;
          }
        }
      }
    }
    return o;
  }

  function isObject(o){
    return o != null && typeof o === 'object' || typeof o === 'function';
  }

  function isIndexed(o){
    return Array.isArray(o) || isObject(o) && has(o, 'length') && has(o, o.length - 1);
  }

  // ############
  // ### Path ###
  // ############

  function Path(a){
    if (isIndexed(a)) {
      push_.apply(this, a);
    }
  }

  Path.prototype.length = 0;

  decorate(Path.prototype, {
    join: Array.prototype.join,
    map: Array.prototype.map,
    concat: function concat(){
      var out = new Path(this);
      push_.apply(out, arguments);
      return out;
    },
    args: function args(){
      return filter_.call(this, function(s){
        return s[0] === 'Δ';
      }).map(function(s){
        return s.replace(/Δ/g, '');
      });
    },
    toName: function toName(slice, last){
      var array = map_.call(this, function(s){
        return s.replace(/Δ/g, '');
      });

      if (last) {
        array.push(last);
      }

      var out = array.slice(slice || 1).map(function(s){
        return s[0].toUpperCase() + s.slice(1).toLowerCase();
      });

      if (!out[0]) {
        return '';
      } else {
        out[0] = out[0].toLowerCase();
        return out.join('').replace(/_(.)/g, function(s){
          return s[1].toUpperCase();
        });
      }
    },
    slice: function slice(){
      return new Path(slice_.apply(this, arguments));
    }
  });


  // #################
  // ### Transport ###
  // #################

  // superclass for XHR and JSONP

  function Transport(options, callback){
    options = options || {};
    if (typeof options === 'string') {
      options = { url: options };
    }
    if (typeof callback === 'function') {
      options.callback = callback;
    }
    this.data = options.data || {};
    this.path = options.path || [];
    this.base = options.url;
    this.callback = options.callback || function(){};
    this.state = 'idle';
  }

  Transport.transports = {};

  decorate(Transport, {
    register: function register(ctor){
      Transport.transports[ctor.name.toLowerCase()] = ctor;
    },
    lookup: function lookup(name){
      name = name.toLowerCase();
      return name in Transport.transports ? Transport.transports[name] : null;
    },
    create: function create(type, base, dispatcher){
      var T = Transport.lookup(type);
      return new T(base, dispatcher);
    }
  });


  decorate(Transport.prototype, {
    params: function params(){
      var data = Object.keys(this.data).map(function(name){ return [name, this.data[name]] }, this);
      data.push([this.callbackParam, this.callbackName]);
      return data.map(function(item){
        return encodeURIComponent(item[0]) + '=' + encodeURIComponent(item[1]);
      }).join('&');
    }
  });

  // #######################
  // ### JSONP Transport ###
  // #######################

  function JSONP(options, callback){
    Transport.call(this, options = options || {}, callback);
    this.callbackParam = options.callbackParam || 'callback';
    this.callbackName = options.callbackName || '_'+Math.random().toString(36).slice(2);
  }

  Transport.register(JSONP);

  JSONP.prototype = Object.create(Transport.prototype);
  decorate(JSONP.prototype, {
    constructor: JSONP,
    url: function url(){
      return [this.base].concat(this.path).join('/') + '?' + this.params();
    },
    send: function send(callback){
      var script = document.createElement('script'),
          completed

      callback = callback || this.callback;

      function complete(state, result){
        if (!completed) {
          completed = true;
          delete window[this.callbackName];
          document.body.removeChild(script);
          this.state = state;
          callback.call(this, result);
        }
      }

      script.src = this.url();
      script.async = script.defer = true;
      script.onerror = complete.bind(this, 'error');
      window[this.callbackName] = complete.bind(this, 'success');

      document.body.appendChild(script);
      this.state = 'loading';
      return this;
    }
  });

  // ################################
  // ### XMLHttpRequest Transport ###
  // ################################

  function XHR(options, callback){
    this.headers = {};
    options = options || {}

    Transport.call(this, options, callback);

    if (options.headers) {
      Object.keys(options.headers).forEach(function(n){
        this[n] = options.headers[n];
      }, this.headers);
    }
  }

  Transport.register(XHR);

  XHR.prototype = Object.create(Transport.prototype);
  decorate(XHR.prototype, {
    constructor: XHR,
    url: function url(){
      var params = this.params();
      return [this.base].concat(this.path).join('/') + (this.verb === 'get' && params ? '?' + params : '');
    },
    auth: function auth(user, pass){
      if (!pass && user.length === 40) {
        this.headers.Authorization = 'token '+user;
      } else {
        this.headers.Authorization = 'Basic '+btoa(user+':'+pass);
      }
    },
    send: function send(callback, verb){
      var xhr = new XMLHttpRequest,
          self = this;

      if (typeof callback !== 'function') {
        verb = callback;
        callback = this.callback;
      }

      function complete(data){
        if (xhr.readyState === 4) {
          self.state = 'complete';
          callback.call(self, JSON.parse(xhr.responseText));
        }
      }

      xhr.open(verb || 'GET', this.url());
      if (this.headers.Authenticate) {
        xhr.withCredentials = true;
      }

      Object.keys(this.headers).forEach(function(name){
        xhr.setRequestHeader(name, self.headers[name]);
      });

      xhr.onerror = complete;
      xhr.onload = complete;

      xhr.send(this.data ||  null);
      this.state = 'loading';
      return this;
    }
  });


  function makeCtor(args, api){
    var Ctor = function(){
      var self = this instanceof Ctor ? this : Object.create(Ctor.prototype);
      return api.request(arguments, args, self);
    }

    decorate(Ctor, {
      args: Object.freeze(args),
      toString: function toString(){ return '[ '+this.args.join(', ')+' ]' }
    });
    return Ctor;
  }

  // #################
  // ### APIClient ###
  // #################

  // generalized REST API handler that turns routes into functions

  function APIClient(routes, onlyGetters){
    var self = this;
    var slices = {};

    function recurse(o,path){
      Object.keys(o).forEach(function(k){
        if (k === 'SLICE') {
          slices[path[0]] = o[k];
        } else if (k.toUpperCase() === k) {
          if (onlyGetters) {
            if (k !== 'GET') return;
            var name = path.toName(slices[path[0]]);
          } else {
            var name = path.toName(slices[path[0]], k);
          }

          if (name) {
            var target = self[path[0]] || (self[path[0]] = {});
          } else {
            name = path[0];
            var target = self;
          }

          target[name] = makeCtor(path.args().concat(o[k]), self);

          Object.defineProperty(target[name].prototype, 'path', {
            get: function(){
              return path.map(function(s){
                return s[0] === 'Δ' ? this[s.slice(1)] : s;
              }, this).join('/');
            }
          });

        } else if (isObject(o[k])) {
          recurse(o[k], path.concat(k));
        }
      });
    }

    recurse(routes, new Path);
  }

  decorate(APIClient.prototype, {
    request: function request(args, fields, req){
      args = [].slice.call(args);
      var callback = typeof args[args.length-1] === 'function' ? args.pop() : this.callback;
      fields.forEach(function(p,i){
        if (typeof args[i] != null) {
          req[p] = args[i];
        }
      });
      var transport = decorate(Object.create(this.transport), {
        path: req.path,
        data: req
      });
      transport.send(callback);
      return transport;
    },
    setTransport: function setTransport(type, base, dispatcher){
      Object.defineProperty(this, 'transport', {
        value: Transport.create(type, base, dispatcher),
        configurable: true,
        writable: true
      });
    }
  });


  // ####################
  // ### GithubClient ###
  // ####################

  // APIClient subclass with routes and utilities for Github

  function GithubClient(user, password){
    var self = this;

    function findRefs(obj){
      isObject(obj) && Object.keys(obj).forEach(function(key){
        if (key !== 'url') return;

        var val = obj[key].slice(23).split('/');
        var fn = self[val[0]];
        if (!fn) return;
        if (fn[val[1]]) {
          fn = fn[val[1]];
          val = val.slice(2);
        } else {
          val = val.slice(1);
        }

        obj.resolve = function(cb){
          if (typeof cb === 'function') val.push(cb);
          return fn.apply(null, val);
        }.bind(null);

        if (isObject(obj[key])) {
          return findRefs(obj[key]);
        }
      });
    }

    this.setTransport('xhr', 'https://api.github.com', function(result){
      if (result) {
        findRefs(result);
        self.lastResult = result;
      }
      if (self.callback) {
        self.callback.call(self, result);
      }
    });

    this.transport.headers.Accept = 'application/vnd.github.full+json';
    if (user) {
      this.transport.auth(user, password);
    }

    APIClient.call(this, githubRoutes, true);
    this.users.search = this.legacy.userSearchKeyword;
    this.users.searchEmails = this.legacy.userEmailEmail;
    this.repos.search = this.legacy.reposSearchKeyword;
    this.repos.searchIssues = this.legacy.issuesSearchOwnerRepositoryStateKeyword;
    delete this.legacy;
  }

  GithubClient.createClient = function createClient(user, pass){
    return new GithubClient(user, pass);
  };

  GithubClient.prototype = Object.create(APIClient.prototype)
  decorate(GithubClient.prototype, {
    constructor: GithubClient
  });

  return GithubClient;

// ########################################
// ### Routes for Github V3 API in full ###
// ########################################

}(new Function('return this')(), {
  legacy:{SLICE:1,issues:{search:{Δowner:{Δrepository:{Δstate:{Δkeyword:{GET:[]}}}}}},repos:{search:{Δkeyword:{GET:['language','start_page']}}},user:{search:{Δkeyword:{GET:[]}},email:{Δemail:{GET:[]}}}},
  gists:{SLICE:1,POST:['description','public','files'],GET:['page','per_page'],public:{GET:[]},starred:{GET:[]},Δid:{GET:[],PATCH:['description','files'],star:{GET:[],DELETE:[],POST:[]},fork:{POST:[]},comments:{GET:[],POST:['input'],Δid:{GET:[],DELETE:[],PATCH:['body']}}}},
  teams:{SLICE:2,Δid:{GET:[],DELETE:[],PATCH:['name','permission'],members:{GET:['page','per_page'],Δuser:{GET:[],DELETE:[],POST:[]}},repos:{GET:['page','per_page'],Δuser:{Δrepo:{GET:[],DELETE:[],POST:[]}}}}},
  orgs:{SLICE:2,Δorg:{GET:['page','per_page'],PATCH:['billing_email','company','email','location','name'],members:{GET:['page','per_page'],Δuser:{GET:[],DELETE:[]}},public_members:{GET:[],Δuser:{GET:[],DELETE:[],POST:[]}},teams:{GET:[],POST:['name','repo_names','permission']},repos:{GET:['type','page','per_page'],POST:['name','description','homepage','private','has_issues','has_wiki','has_downloads','team_id'],Δsha:{GET:[]}}}},
  repos:{SLICE:3,Δuser:{Δrepo:{GET:[],GET2:['page','per_page'],PATCH:['name','description','homepage','private','has_issues','has_wiki','has_downloads'],contributors:{GET:['anon','page','per_page']},languages:{GET:['anon','page','per_page']},teams:{GET:['page','per_page']},tags:{GET:['page','per_page'],Δsha:{POST:['tag','message','object','type','tagger.name','tagger.email','tagger.date']}},git:{refs:{POST:['refs','sha'],GET:['page','per_page'],Δref:{GET:[],PATCH:['sha','force']}},commits:{POST:['message','tree','parents','author','committer'],Δsha:{GET:[]}},blobs:{POST:['content','encoding'],Δsha:{GET:['page','per_page']}}},
    branches:{GET:['page','per_page']},events:{GET:['page','per_page']},issues:{GET:['milestone','state','assignee','mentioned','labels','sort','direction','since','page','per_page'],POST:['title','body','assignee','milestone','labels'],events:{GET:['page','per_page'],GET2:[],Δid:{}},Δnumber:{GET:[],PATCH:['title','body','assignee','milestone','labels'],comments:{GET:['page','per_page'],POST:['body']},events:{GET:['page','per_page']}},comments:{Δid:{GET:[],DELETE:[],PATCH:['body']}},},pulls:{GET:['state','page','per_page'],POST:['title','body','base','head'],POST2:['issue','base','head'],Δnumber:{GET:[],PATCH:['state','title','body'],merge:{GET:['page','per_page'],POST:['commit_message']},files:{GET:['page','per_page']},commits:{GET:['page','per_page']},
    comments:{POST:['body','in_reply_to'],POST2:['body','commit_id','path','position'],GET:['page','per_page'],}},comments:{Δnumber:{GET:[],DELETE:[],PATCH:['body']}}},commits:{GET:['sha','path','page','per_page'],Δsha:{GET:[],comments:{GET:['page','per_page'],POST:['body','commit_id','line','path','position']}},},comments:{Δid:{GET:[],DELETE:[],PATCH:['body']}},compare:{ΔbaseΔhead:{GET:['base','head']}},download:{GET:['page','per_page']},downloads:{Δid:{GET:[],DELETE:[]}},forks:{POST:['org'],GET:['sort','page','per_page']},labels:{GET:[],POST:['name','color'],Δname:{GET:[],POST:['color']}},keys:{GET:['page','per_page'],POST:['title','key'],Δid:{GET:[],DELETE:[],POST:['title','key']}},watchers:{GET:['page','per_page']},
    hooks:{GET:['page','per_page'],POST:['name','config','events','active'],Δid:{GET:[],DELETE:[],PATCH:['name','config','events','add_events','remove_events','active'],test:{POST:[]}}},milestones:{POST:['title','state','description','due_on'],GET:['state','sort','page','per_page'],Δnumber:{DELETE:[],GET:[],PATCH:['title','state','description','due_on']}},trees:{POST:['tree'],Δsha:{GET:['recursive']}},collaborators:{GET:['page','per_page'],Δcollabuser:{GET:[],DELETE:[],POST:[]}}}}},
    authorizations:{SLICE:0,GET:[]},
  user:{SLICE:1,GET:[],PATCH:['name','email','blog','company','location','hireable','bio'],gists:{GET:['page','per_page']},emails:{GET:['page','per_page'],DELETE:[],POST:[]},following:{GET:['page','per_page'],Δuser:{GET:['page','per_page'],DELETE:[],POST:[]}},watched:{GET:['page','per_page'],Δuser:{Δrepo:{GET:['page','per_page'],DELETE:[],POST:[]}}},keys:{GET:['page','per_page'],POST:['title','key'],Δid:{GET:[],DELETE:[],PATCH:['title','key']}},repos:{GET:['type','page','per_page'],POST:['name','description','homepage','private','has_issues','has_wiki','has_downloads']}},
  users:{SLICE:2,Δuser:{GET:[],gists:{GET:['page','per_page']},followers:{GET:['page','per_page']},following:{GET:['page','per_page']},orgs:{GET:['page','per_page']},watched:{GET:['page','per_page']},received_events:{GET:['page','per_page']},events:{GET:['page','per_page']},repos:{GET:['type','page','per_page']}}},
  networks:{SLICE:2,Δuser:{Δrepo:{events:{GET:['page','per_page']}},events:{orgs:{Δorg:{GET:['page','per_page']}}}}},
  events:{SLICE:1,GET:['page','per_page']}
}));
