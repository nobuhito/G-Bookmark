var bookmark_folder_id;
var min_id = '';

chrome.extension.onConnect.addListener( function(port) {
    port.onMessage.addListener(function(msg) {
        if (msg.action == 'load_bookmark') {
            load_bookmark(msg.args, port);
        } else if (msg.action == 'save_bookmark') {
            save_bookmark(msg.args);
            senResponse({});
        } else if (msg.action == 'del_bookmark') {
            del_bookmark(msg.args);
            sendResponse({});
        }
    });
});

function save_bookmark(url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var title = (xhr.responseText.match(/<title>([.\s\S]*)<\/title>/))? RegExp.$1: '';
            chrome.bookmarks.create(
                {
                    "parentId": bookmark_folder_id,
                    "index": 0,
                    "title": title,
                    "url": url
                }
            );
        }
    }
    xhr.open('GET', url, true);
    xhr.send();
}

function del_bookmark(url) {
    chrome.bookmarks.getChildren(bookmark_folder_id, function(list) {
        for (i=0; i<list.length; i++) {
            if (list[i].url == url) {
                chrome.bookmarks.remove(list[i].id);
                break;
            }
        }
    });
}

function load_bookmark(bookmark_folder, port) {
    var bookmarks = [];
    var min_id;

    chrome.bookmarks.getTree(function(roots) {
        roots.forEach(function(item) {
            bookmarks = processNode(item, bookmarks, min_id, bookmark_folder);
        });
        if (bookmarks.length > 0) {
            port.postMessage({action: 'load_bookmark', result: bookmarks});
        } else {
            chrome.bookmarks.create({"parentId": min_id,
                                     "index": 0,
                                     "title": bookmark_folder});
        }
    });
}

function processNode(item, bookmarks, min_id, bookmark_folder) {
    if (min_id == '' && min_id > item.id) {
        min_id = item.id;
    }
    if (item.title == bookmark_folder) {
        bookmark_folder_id = item.id;
    }
    if (item.children) {
        item.children.forEach(function(child) {
            bookmarks = processNode(child, bookmarks, min_id, bookmark_folder);
        });
    }
    if (item.url && item.url.match(/^https\:\/\/plus\.google\.com\//)) {
        bookmarks.push(item.url);
    }
    return bookmarks;
}
