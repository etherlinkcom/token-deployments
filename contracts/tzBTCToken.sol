// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";


contract tzBTCToken is OwnableUpgradeable, ERC20PermitUpgradeable, UUPSUpgradeable {
    string private constant _name = "Tezos Bitcoin";
    string private constant _symbol = "tzBTC";

    event Mint(address indexed to, uint amount);
    event Burn(address indexed to, uint amount);

    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) initializer public {
        __ERC20_init(_name, _symbol);
        __Ownable_init(_owner);
        __ERC20Permit_init(_name);
        __UUPSUpgradeable_init();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function burn(address to, uint256 amount) public onlyOwner {
        _burn(to, amount);
        emit Burn(to, amount);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
