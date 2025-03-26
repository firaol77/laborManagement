/**
 * Get the local network IP address that can be used to access this machine
 * from other devices on the same network
 */
const { networkInterfaces } = require("os")

function getNetworkIP() {
  const nets = networkInterfaces()
  const results = []

  // Collect all non-internal IPv4 addresses
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over internal and non-IPv4 addresses
      if (net.family === "IPv4" && !net.internal) {
        results.push({
          name,
          address: net.address,
          netmask: net.netmask,
          cidr: net.cidr,
        })
      }
    }
  }

  // If we found any addresses, return the first one
  // You could add more logic here to pick the "best" one
  if (results.length > 0) {
    console.log("Available network interfaces:")
    results.forEach((iface, i) => {
      console.log(`${i + 1}. ${iface.name}: ${iface.address} (${iface.netmask})`)
    })
    return results[0].address
  }

  // Fallback to localhost if no network interfaces found
  return "127.0.0.1"
}

// If this script is run directly, print the IP
if (require.main === module) {
  const ip = getNetworkIP()
  console.log(`\nUsing network IP: ${ip}`)
}

module.exports = getNetworkIP

