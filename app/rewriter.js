let url404 = [], url200 = [], fuzzy = {}, searcher = [], score;
let input404 = document.querySelector(`#input404`);
let input200 = document.querySelector(`#input200`);
let output = document.querySelector(`#output`);
let scoreLimit = document.querySelector(`#limit`);
let generatedTime = document.querySelector(`#time`);
const EXCLUDES = [`/wyklucz`];

const init = function() {
  fuzzy = new FuzzySearch({source:url200});
  fuzzy.setOptions({
    token_sep: `\\/\,\. `,
    keys: [],
    score_per_token: true,
    score_test_fused: false,
    score_acronym: false,
    output_limit: 1,
    output_map: `root`,
    dirty: true
  });
}

const getPath = function(url=``) {
      let link = document.createElement(`a`);
      link.href = url;
      return link.pathname.replace(`/rewriter/`, `/`);
    }

const exclude = function(url) {
    return getPath(url);
    //TODO: excludes
    //return (EXCLUDES.map((x, url) => x === url)) ? "/" : getPath(url);
}

const set404List = function(list) {
  url404 = Array.from(new Set(list.toLowerCase().split(`\n`).filter(Boolean).map(exclude))).sort();
}

const set200List = function(list) {
  url200 = Array.from(new Set(list.toLowerCase().split(`\n`).filter(Boolean).map(exclude))).sort();
}

const limitScoring = function(matched) {
  return (score > scoreLimit.value) ? matched : ``;
}

const cleanRegex = function(url){
  url = getPath(url).replace(/^\//, ``);
  return url.replace(/\//g, `\\\/`).replace(/\./g, `\\\.`);
}

const Schema = {
  rewriteRule: function(url, matched) {
    return `RewriteRule ^${cleanRegex(url)}$ ${getPath(matched)} [R=301,NC,L]`;
  },
  redirect301: function(url, matched) {
    return `Redirect 301 ${getPath(url)} ${getPath(matched)}`;
  },
  rewriteCond: function(url, matched) {
    return `RewriteCond %{REQUEST_URI} ^${cleanRegex(url)}$<br>RewriteRule ^(.*)$ ${getPath(matched)} [R=301,NC,L]`;
  },
  phpRequestUri: function(url, matched, index) {
    return ((index) ? `else` : ``) + `if($_SERVER['REQUEST_URI']=='${getPath(url)}') {<br>header("HTTP/1.1 301 Moved Permanently");<br>header("Location: ${getPath(matched)}");<br>header("Connection: close");<br>exit;<br>}`;
  },
  joomlaMod: function(url, matched) {
    return url + `|` + getPath(matched);
  },
  nginx: function(url, matched) {
    return `location = ${url} {<br> &nbsp; return 301 ${getPath(matched)}<br>}`;
  },
  iis: function(url, matched) {
    return `&#x3C;rule name="redirect" stopProcessing="true"&#x3E;<br>&#x3C;match url="^${cleanRegex(url)}$" /&#x3E;<br>&#x3C;action type="Redirect" url="${getPath(matched)} /&#x3E;<br>&#x3C;/rule&#x3E;`;
  },
  scoring: function(url, matched) {
    generatedTime.innerHTML = `${fuzzy.search_time.toFixed(3)} ms`;
    return `${url} <span class="badge badge-pill badge-${(limitScoring("success") || "danger")}"> ${score.toFixed(1)} </span> ${fuzzy.highlight(getPath(matched))}`;
  }
}

const generate = function(getSchema) {
  let url, matched;
  output.innerHTML = "";

  init();

  for (let i = 0, length = url404.length; i < length; i++) {
    url = url404[i];
    searcher = fuzzy.search(url);
    searcher[0] = searcher[0] || {item: "/", score: 0};
    matched = searcher[0].item;
    score = searcher[0].score;
    (url !== matched) ? output.innerHTML += `<p>${getSchema(url, limitScoring(matched), i)}</p>` : ``;
  }
}

document.querySelector(`form`).addEventListener('submit', function(e) {
    generate(Schema.scoring);
    e.preventDefault();
}, false);
