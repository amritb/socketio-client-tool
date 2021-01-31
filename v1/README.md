# [socketio-client-tool](http://amritb.github.io/socketio-client-tool/)
This tools helps you to test socket.io servers.

<img src="https://amritb.github.io/socketio-client-tool/screenshot.png" alt="Socket.io Client Tool"></img>

The [URL](http://amritb.github.io/socketio-client-tool/) should work in most cases. But if you want to run it locally, follow these instructions: 

#### Docker

If you would like to run this tool as a container using [Docker](https://www.docker.com/), follow the below instructions.

1. Run the container

    ```bash
    docker run --rm -p 8080:8080 amritb/socketio-client-tool:latest
    ```

#### Command Line

To run using the server (http-server) that is included with this tool. Follow the below instructions:

1. Clone this repository:

    ```bash
    git clone https://github.com/amritb/socketio-client-tool.git
    ```

2. Navigate to the cloned directory:

    ```bash
    cd socketio-client-tool
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Run using:

    ```bash
    npm start
    ```

(Optional) socketio-client-tool uses [http-server](https://www.npmjs.com/package/http-server) to serve static files. To pass additional options as found in the http-server documentation, run the above but prefix your commands with `--`. For example, to run on port 8099:

```bash
npm start -- -p 8099
```

## TODOs
1. ~~Functional event emit modal~~
2. ~~Add events and socket.io URL to page URL so that it can be shared with set inputs~~
3. ~~Add toggle button to stringify or not to stringify data while emitting~~
4. ~~Store history of emits - and can be re-sent in just one click~~
5. ~~Change timestamps to better formatted time~~
6. Fix URL hashes - if the has only has url value, initiate the app with the connected URL, and no extra event should be added
7. ~~Show socket.id somewhere in the UI (easy to copy)~~
8. Helper links/buttons to add basic socketio events like reconnect, etc.
9. Page titles should show the socket.io connection urls
10. ~~Clear button on panels~~
11. Emit buttons on panel headers - which will prefill the emit form's message input field
