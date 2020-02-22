let _myLog;
let mytimer;
  function showWebhooks(hooks) {
    let htmlstring = ""
    let headerstring = '<div class="rTableRow"><div class="rTableCell line rTableHead">HookID</div><div class="rTableCell line rTableHead">URL</div></div> '
    hooks.forEach(value => {
      console.log(htmlstring)
         htmlstring = htmlstring + `<div class="rTableRow"><div class="rTableCell line">${value.hook_id}</div><div class="rTableCell line">${value.url}</div></div>`
    });
    htmlstring = headerstring + htmlstring
    console.log(htmlstring)
    document.getElementById('webhookstab').innerHTML = htmlstring
    document.getElementById('webhooks').style.display = 'block';
  }

  function showLogin() {
    document.getElementById('logout').style.display = 'none';
    document.getElementById('login').style.display = 'block';
  }

  function showLogout() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('logout').style.display = 'block';
  }

  function login() {
    Homey.api('POST', '/login/', {
      state: true
    }, function(err, success) {
      console.log(`error: ${err} Success:${success}`)
      if (!err && success) showLogout()
    });
  }

  function gethooks() {
    Homey.api('get', '/webhooks/', {}, function(err, webhooks) {
      console.log(`error: ${err} Success:${webhooks}`)
        if (!err) {
          console.log(webhooks)
          showWebhooks(webhooks);
        }
      })
  }
  function refreshooks() {
    Homey.api('POST', '/webhooks/', {}, function(err, webhooks) {
      console.log(`error: ${err} Success:${webhooks}`)
        if (!err) {
          console.log(webhooks)
          showWebhooks(webhooks);
        }
      })
  }

  function logout() {
    Homey.api('POST', '/login/', {
      state: false
    }, function(err, success) {
      console.log(`error: ${err} Success:${success}`)
      if (!err && success) showLogin();
    });
  }

  function onHomeyReady(Homey) {
    Homey.on('url', url => Homey.openURL(url));
    Homey.on('authorized', () => showLogout());
    Homey.on('error', err => {
      if (err) return Homey.alert(err.message || err);
    });
    Homey.api('GET', '/login/', {}, function(err, loggedIn) {
      if (loggedIn) {
        showLogout();
        gethooks();
        refreshHistory();
      } else {
        showLogin();
      }
    });
    var LogValuesElement = document.getElementById('LogValues');

    Homey.get('myLogActive', function( err, logging ) {
             if( err ) return Homey.alert( err );
             LogValuesElement.checked = logging;
          });
    Homey.ready();
  }
  function refreshHistory() {
    try
    {
      mytimer = setTimeout(refreshHistory, 1000);
      showHistory(0);
    }
    catch (err)
    {
      clearTimeout(mytimer);
    }
}
function setLogger(checked)
{
  console.log(`Logger set to ${checked}`);
  Homey.set('myLogActive', checked, function( err ){
    if( err ) return Homey.alert( err );
  });
}
  function showHistory(run) {
    Homey.get('myLog', function(err, logging){
        if( err ) {
          clearTimeout(mytimer);
          return console.error('showHistory: Could not get history', err);
        }
        if (_myLog !== logging || run == 1 ){
            console.log("_myLog !== logging || run == 1")
            _myLog = logging
            // Need work here -> done!
            document.getElementById('logtextarea').value = logging;

            let color = ""
            let htmlstring = ""
            let historyArray = logging.split("\n")
            let dark = false
            let headerstring = '<div class="rTableRow"><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.date") + '</div><div class="rTableCell line rTableHead">' + Homey.__("tab1.history.time") + '</div><div class="rTableCell line rTableHead">Logmessage</div></div>'

            historyArray.forEach(element => {
                element = element.replace(/ \|\| /g,'</div><div class="rTableCell line">')
                if ( element != "") {
                    //element = element.substr(3, element.length - 3 )
                    htmlstring = htmlstring + '<div class="rTableRow"><div class="rTableCell line">' + element + "</div></div>"
                }
            });
            htmlstring = headerstring + htmlstring
            document.getElementById('historyTable').innerHTML = htmlstring
        }
    });
  }
  function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var msec = ("00" + date.getMilliseconds()).slice(-3)

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return day + "-" + month + "-" + year + "  ||  " + hour + ":" + min + ":" + sec + "." + msec + "  ||  ";
}
function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
function downloadHistory() {
    download('PointLog.txt', document.getElementById('logtextarea').value);
};
