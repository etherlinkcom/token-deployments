#!/bin/bash

networks=("etherlink" "mainnet" "arbitrumOne" "base" "bsc")

# Define the log file
log_file="WXTZ_config.log"

# Clear the log file at the beginning
> $log_file

# Loop through each combination of networks
for (( i=0; i<${#networks[@]}; i++ )); do
  for (( j=i+1; j<${#networks[@]}; j++ )); do
    # Assign target and source networks
    network_A=${networks[$i]}
    network_B=${networks[$j]}

    # Run the command with A as target and B as source
    echo "Map - source network $network_A, destination network $network_B"
    echo "###################### $network_A <> $network_B ######################" >> $log_file
    # Is peer
    echo "Running: targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getPeer.ts >> $log_file 2>&1"
    targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getPeer.ts >> $log_file 2>&1
    # Get the config
    echo "Running: targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getConfig.ts >> $log_file 2>&1"
    targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getConfig.ts >> $log_file 2>&1
    # Get the enforced options
    echo "Running: targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getEnforcedOptions.ts >> $log_file 2>&1"
    targetNetworkName=$network_B npx hardhat run --network $network_A scripts/getEnforcedOptions.ts >> $log_file 2>&1
    echo "######################################################################" >> $log_file
    echo "" >> $log_file

    # Run the command with B as target and A as source
    echo "Map - source network $network_B, destination network $network_A"
    echo "###################### $network_B <> $network_A ######################" >> $log_file
    # Is peer
    echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getPeer.ts >> $log_file 2>&1"
    targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getPeer.ts >> $log_file 2>&1
    # Get the config
    echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getConfig.ts >> $log_file 2>&1"
    targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getConfig.ts >> $log_file 2>&1
    # Get the enforced options
    echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getEnforcedOptions.ts >> $log_file 2>&1"
    targetNetworkName=$network_A npx hardhat run --network $network_B scripts/getEnforcedOptions.ts >> $log_file 2>&1
    echo "######################################################################" >> $log_file
    echo "" >> $log_file
  done
done
