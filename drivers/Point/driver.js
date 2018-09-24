'use strict';

const Homey = require('homey');
const util = require('../../Lib/utils')

class Point extends Homey.Driver  {

    onPair( socket ) {
		//console.log(Homey.env.CLIENT_ID)
		let ruri = ' http://localhost:8000'
        let apiUrl = 'https://api.minut.com/v1/oauth/authorize?client_id=' + Homey.env.CLIENT_ID + '&response_type=code&redirect_uri=' + ruri
        util.logtoall("Pair","Started Pairing.")
        let myOAuth2Callback = new Homey.CloudOAuth2Callback(apiUrl)
            myOAuth2Callback
                .on('url', url => {

                    // dend the URL to the front-end to open a popup
                    socket.emit('url', url);

                })
                .on('code', code => {

                    // ... swap your code here for an access token

                    // tell the front-end we're done
                    socket.emit('authorized');
                })
                .generate()
                .catch( err => {
                    util.logtoall("Pair","Error Received on Pair: " + err)
                    socket.emit('error', err);
                })

    }

}
module.exports = Point;