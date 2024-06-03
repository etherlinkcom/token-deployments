// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title tzBTC Token
 * @dev This contract implements tzBTC as an ERC20 with public mint and burn logic.
 * It should be deployed on Etherlink with a UUPS proxy setup.
 * This can be made bridgeable to other EVM chains as an OFT via the tzBTCAdapter contract.
 * NOTE: this is the version called adapted because this one is used like a classic ERC20 that you plug an OFTAdapter on top of.
 */
contract tzBTCTokenAdapted is Initializable, ERC20Upgradeable, ERC20PermitUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    string private constant _name = "Tezos Bitcoin";
    string private constant _symbol = "tzBTC";

    event Mint(address indexed to, uint amount);
    event Burn(address indexed from, uint amount);

    /**
     * @dev The contract constructor.
     * This prevents the `initialize` method from being repeatedly called.
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev The implementation constructor
     * @param _owner The contract owner
     */
    function initialize(address _owner) initializer public {
        __ERC20_init(_name, _symbol);
        __ERC20Permit_init(_name);
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Upgrade the implementation logic to a new contract. Only the contract owner can call this method.
     * @param newImplementation Address of the new implementation contract
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
