#!/bin/bash

networks=("etherlink" "bsc" "arbitrumOne" "base" "mainnet")

# Loop through each combination of networks
for (( j=i+1; j<${#networks[@]}; j++ )); do
  # Assign target and source networks
  network_A=${networks[0]}
  network_B=${networks[$j]}

  # Run the command with A as target and B as source
  echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/setLibs.ts"
  targetNetworkName=$network_A npx hardhat run --network $network_B scripts/setLibs.ts

  # Run the command with B as target and A as source
  echo "Running: targetNetworkName=$network_B npx hardhat run --network $network_A scripts/setLibs.ts"
  targetNetworkName=$network_B npx hardhat run --network $network_A scripts/setLibs.ts
done