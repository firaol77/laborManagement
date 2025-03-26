/**
 * Development script to start both frontend and backend servers
 * with the correct network IP configuration
 */
const { spawn } = require("child_process")
const path = require("path")
const getNetworkIP = require("./get-network-ip")

// Get the network IP
const networkIP = getNetworkIP()
console.log(`Using network IP: ${networkIP}`)

// Get the path to the server directory
const serverDir = path.join(__dirname, "../../server")

// Start the backend server
console.log("Starting backend server...")
const backend = spawn("node", ["server.js"], {
  env: {
    ...process.env,
    PORT: "3001",
    NETWORK_IP: networkIP,
  },
  stdio: "inherit",
  cwd: serverDir, // Set the current working directory to the server directory
})

// Start the frontend server
console.log("Starting frontend server...")
const frontend = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["start"], {
  env: {
    ...process.env,
    HOST: networkIP,
    PORT: "3002",
    REACT_APP_API_URL: `http://${networkIP}:3001/api`,
  },
  stdio: "inherit",
  cwd: path.join(__dirname, ".."), // Set the current working directory to the client directory
})

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down servers...")
  backend.kill()
  frontend.kill()
  process.exit()
})

// Log any errors
backend.on("error", (error) => {
  console.error("Backend error:", error)
})

frontend.on("error", (error) => {
  console.error("Frontend error:", error)
})

