var request = require('request');
var request = request.defaults({ jar: true })
var cheerio = require('cheerio');

module.exports = function (RED) {
    function GetIDsalusit500(config) {
        RED.nodes.createNode(this, config);

        var postdata = {
            url: 'https://salus-it500.com/public/login.php',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            form:
            {
                IDemail: this.credentials.username,
                password: this.credentials.password,
                login: 'Login'
            }
        }
        var flowContext = this.context().flow;
        var node = this;
        node.on('input', function (msg) {
            request.post(postdata, (err, response, body) => {
                if (err) {
                    return console.error('login failed:', err);
                }
                console.log('Logged in')
                request.get('https://salus-it500.com/public/devices.php', (err, getresponse, html) => {
                    var $ = cheerio.load(html)
                    var currentToken = $('#token').attr('value')
                    var devId = $('input[name="devId"]').attr('value')

                    flowContext.set('token', currentToken);
                    flowContext.set('devId', devId);

                    this.status({ fill: "green", shape: "dot", text: currentToken });
                    msg.payload = { token: currentToken, id: devId }
                    node.send(msg);
                })
            });
        });
    }
    RED.nodes.registerType("Retrieve ID and Token", GetIDsalusit500, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });


    function SetTempsalusit500(config) {
        RED.nodes.createNode(this, config);

        var flowContext = this.context().flow;
        var node = this;
        node.on('input', function (msg) {
            var cToken = flowContext.get('token') || 0;
            var cdevId = flowContext.get('devId') || 0;

            if (cToken == 0 || cdevId == 0) {
                msg.payload = 'No token or device id found.';
                node.send([null, msg])
            } else {
                var postdata = {
                    url: 'https://salus-it500.com/includes/set.php',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    form:
                    {
                        token: cToken,
                        tempUnit: 0,
                        devId: cdevId,
                        current_tempZ1_set: 1,
                        current_tempZ1: msg.payload
                    }
                }
                request.post(postdata, (err, response, body) => {
                    if (err) {
                        msg.payload = msg;
                        node.warn(msg);
                        return console.error('Failed:', err);
                    }
                    var body2json = JSON.parse(body);
                    if (body2json.errorMsg) {
                        msg.payload = body2json.errorMsg;
                        node.send([null, msg]);
                    } else {
                        this.status({ fill: "green", shape: "dot", text: msg.payload });
                        node.send([msg, null]);
                    }
                });
            }
        });
    }
    RED.nodes.registerType("Set temperature", SetTempsalusit500);

    function GetTempsalusit500(config) {
        RED.nodes.createNode(this, config);

        var flowContext = this.context().flow;
        var node = this;
        node.on('input', function (msg) {
            var cToken = flowContext.get('token') || 0;
            var cdevId = flowContext.get('devId') || 0;

            if (cToken == 0 || cdevId == 0) {
                msg.payload = 'No token or device id found.';
                node.send([null, msg])
            } else {
                var endpoint = 'https://salus-it500.com/public/ajax_device_values.php?devId=' + cdevId + '&token=' + cToken

                request.get(endpoint, (err, response, body) => {
                    if (err) {
                        return console.error('Failed:', err);
                    }
                    var body2json = JSON.parse(body);

                    if (body2json.frost == 32) {
                        node.send([null, msg])
                    } else {
                        var currentTemp = parseFloat(body2json.CH1currentRoomTemp);
                        var setTemp = parseFloat(body2json.CH1currentSetPoint);
                        this.status({ fill: "green", shape: "dot", text: currentTemp });
                        msg.payload = { Current: currentTemp, Set: setTemp };
                        node.send([msg, null]);
                    }
                });
            }
        });
    }
    RED.nodes.registerType("Current temperature", GetTempsalusit500);
}