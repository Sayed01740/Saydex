// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SaydexToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Saydex Protocol Token", "SAYDEX") {
        _mint(msg.sender, initialSupply);
    }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
