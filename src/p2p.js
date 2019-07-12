const WebSockets = require("ws");

const sockets = [];

const startP2PServer = server => {
    const wsServer = new WebSockets.Server({ server });
    wsServer.on("connection", ws => {
        console.log(`hello ${ws}`);
    });
    console.log("jeagercoin p2p server running ");
};

module.exports = {
  startP2PServer   
}