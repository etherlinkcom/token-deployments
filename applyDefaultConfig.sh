#!/bin/bash

# List of networks, no Etherlink because already setup
networks=("arbitrumOne" "base" "bsc" "mainnet")

# Loop through each combination of networks
for (( i=0; i<${#networks[@]}; i++ )); do
  for (( j=i+1; j<${#networks[@]}; j++ )); do
    # Assign target and source networks
    network_A=${networks[$i]}
    network_B=${networks[$j]}

    # Run the command with A as target and B as source (the script will handle the other way too)
    echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/applyDefaultConfig.ts"
    targetNetworkName=$network_A npx hardhat run --network $network_B scripts/applyDefaultConfig.ts
  done
done
