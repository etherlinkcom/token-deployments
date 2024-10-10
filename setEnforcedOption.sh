#!/bin/bash

# List of networks, no Etherlink because already setup
networks=("mainnet" "arbitrumOne" "base" "bsc")

# Loop through each combination of networks
for (( i=0; i<${#networks[@]}; i++ )); do
  for (( j=i+1; j<${#networks[@]}; j++ )); do
    # Assign target and source networks
    network_A=${networks[$i]}
    network_B=${networks[$j]}

    # Run the command with A as target and B as source
    echo "Running: targetNetworkName=$network_A npx hardhat run --network $network_B scripts/setEnforcedOption.ts"
    targetNetworkName=$network_A npx hardhat run --network $network_B scripts/setEnforcedOption.ts

    # Run the command with B as target and A as source
    echo "Running: targetNetworkName=$network_B npx hardhat run --network $network_A scripts/setEnforcedOption.ts"
    targetNetworkName=$network_B npx hardhat run --network $network_A scripts/setEnforcedOption.ts
  done
done
