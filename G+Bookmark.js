var bookmark_folder = 'GooglePlusBookmarks';
var bookmarks = [];
var added_links = [];           // 時々後検知するので追加済みのURLと照合させる
var port = chrome.extension.connect({name: 'gbookmark'});
port.postMessage({action: 'load_bookmark', args: bookmark_folder});
port.onMessage.addListener(function(msg) {
    if (msg.action == 'load_bookmark') {
        bookmarks = msg.result;
        insert_mark(true);
        setTimeout(function() { // 初回だけ時間かかるので少し遅らせる
            setInterval(function() {insert_mark(false)}, 2000);
        }, 3000);
    }
});

function save_bookmark(url) {
    port.postMessage({"action": "save_bookmark",
                      "args": url});
}

function del_bookmark(url) {
    port.postMessage({"action": "del_bookmark",
                      "args": url});
}

function insert_mark(force) {
    if (bookmarks.length > 0 || force) {
        var link = document.querySelectorAll("a[target]:not(.myMark)");
        for (i=0; i<link.length; i++) {
            if (link[i].href.match(/^((https\:\/\/plus\.google\.com\/)(u\/0\/)?(\d{21}\/posts\/.*))$/)) {

                var url = (RegExp.$3 == '')? RegExp.$2 + 'u/0/' + RegExp.$4: RegExp.$1;
                if (is_exist(url)) { add_star(link[i], url, true); }
                else               { add_star(link[i], url, false); }
            }
            link[i].classList.add('myMark');
        }
    }
}

function add_star(elem, url, flg) {
    if (added_links.indexOf(url) < 1) {
        var space_span = document.createElement("span");
        space_span.innerHTML = ' ';
        elem.parentNode.parentNode.insertBefore(space_span);

        var star_span = document.createElement("span");
        star_span.classList.add('gbookmark');
        star_span.addEventListener('click', function() { click_star(star_span, url) }, false);
        // star_span.onclick = click_star(star_span, url);
        if (flg) star_span.classList.add('active');

        elem.parentNode.parentNode.insertBefore(star_span);
        added_links.push(url);
    }
}

function click_star(elem, url) {
    if (elem.classList.contains('active')) {
        del_bookmark(url);
        elem.classList.remove('active');
    } else {
        save_bookmark(url);
        elem.classList.add('active');
    }
}

function is_exist(url) {
    return (bookmarks.indexOf(url) >= 0)? true: false;
}
