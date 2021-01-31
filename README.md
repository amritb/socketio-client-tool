## Development Environment

#### VS Code

Use `Remote Containers: Reopen in Container`. This should use `.devcontainer/devcontainer.json` configuration to start up a development environment and open your workspace. It opens port 8080 & 8000.

Start a local socket.io server on 8080 with `cd dummy-server && npm install`, then `npm run dev`.

You can start the client app locally with `cd react-client-tool && npm install`, then `yarn start`.
