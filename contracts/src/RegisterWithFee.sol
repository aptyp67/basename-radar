// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RegisterWithFee {
    address public immutable feeRecipient;
    uint256 public immutable feeBps;

    event RegisterIntent(address indexed caller, string name, uint256 feePaid);

    constructor(address _feeRecipient, uint256 _feeBps) {
        require(_feeBps <= 10_000, "fee too high");
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    function register(string calldata name) external payable {
        uint256 fee = (msg.value * feeBps) / 10_000;
        if (fee > 0) {
            (bool sent, ) = feeRecipient.call{value: fee}("");
            require(sent, "fee transfer failed");
        }
        emit RegisterIntent(msg.sender, name, fee);
        // Future: forward remaining value to official Basename registrar
    }
}
