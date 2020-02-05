### Run socket.io server locally to test the client

Nodejs docker
```bash
docker run --rm -it -v <project_path>/socketio-client-tool:/socketio-client-tool -p 8080:8080 node /bin/bash
```

From the container
```bash
cd /socketio-client-tool
npm install
node app.js
```