# node-red-contrib-salus-it500
Custom node to use with a salus it-500.

# Example
This custom node provides the following nodes:
- obtain a valid token and device ID
- set temperature
- get current temperature info
- set auto / off

The token and device ID are used in the set & get which basically means that it's required.

There are also flow context variables you can use to get the values found by these nodes. These are:
- `setTemp`
- `currentTemp`
- `auto` - gets the auto status of the thermostat
- `heatStatus` - gets the status of whether the thermostat has triggered the heating system