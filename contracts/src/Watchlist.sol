// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Watchlist {
    event Watchlisted(address indexed user, string name);
    event Unwatchlisted(address indexed user, string name);

    function add(string calldata name) external {
        emit Watchlisted(msg.sender, name);
    }

    function remove(string calldata name) external {
        emit Unwatchlisted(msg.sender, name);
    }
}
