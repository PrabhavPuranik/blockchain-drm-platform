// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentManager is Ownable {
    struct Content {
        uint256 id;
        string title;
        address payable creator;
        address payable owner; // permanent owner (creator by default)
        uint256 price;
        bool isForSale;
        string encryptedKeyCID;
        uint256 accessDuration; // 0 = permanent ownership model
    }

    // Global content registry
    mapping(uint256 => Content) public contents;
    mapping(bytes32 => bool) public hashExists;

    // Per-user access expiry times (for timed content)
    // contentId => user => expiry timestamp
    mapping(uint256 => mapping(address => uint256)) public userAccessExpiry;

    uint256 private _contentIdCounter;

    event ContentRegistered(uint256 id, string title, address creator, uint256 price, uint256 duration);
    event ContentPurchased(uint256 id, address buyer, uint256 price, uint256 expiresAt);
    event OwnershipTransferredPermanent(uint256 id, address from, address to);

    constructor() Ownable(msg.sender) {}

    // 🟢 Register content with optional timed access duration
    function registerContent(
        string memory _title,
        uint256 _price,
        string memory _encryptedKeyCID,
        bytes32 _fileHash,
        uint256 _accessDuration // 0 = permanent access
    ) external {
        require(!hashExists[_fileHash], "Duplicate content detected");

        _contentIdCounter++;
        uint256 newId = _contentIdCounter;
        hashExists[_fileHash] = true;

        contents[newId] = Content({
            id: newId,
            title: _title,
            creator: payable(msg.sender),
            owner: payable(msg.sender),
            price: _price,
            isForSale: true,
            encryptedKeyCID: _encryptedKeyCID,
            accessDuration: _accessDuration
        });

        emit ContentRegistered(newId, _title, msg.sender, _price, _accessDuration);
    }

    // 🟢 Purchase or renew access
    function purchaseContent(uint256 _id) external payable {
        Content storage c = contents[_id];
        require(c.id != 0, "Content does not exist");
        require(c.isForSale, "Not for sale");
        require(msg.value >= c.price, "Insufficient ETH");
        require(msg.sender != c.creator, "Creator already owns this");

        // Payment logic
        c.creator.transfer(c.price);

        if (c.accessDuration == 0) {
            // 🔹 Permanent purchase → transfer ownership
            c.owner = payable(msg.sender);
            c.isForSale = false;
            emit OwnershipTransferredPermanent(_id, c.creator, msg.sender);
        } else {
            // 🔹 Timed access purchase → assign or extend access
            uint256 newExpiry;
            if (block.timestamp < userAccessExpiry[_id][msg.sender]) {
                // Extend existing access
                newExpiry = userAccessExpiry[_id][msg.sender] + c.accessDuration;
            } else {
                // New access period
                newExpiry = block.timestamp + c.accessDuration;
            }
            userAccessExpiry[_id][msg.sender] = newExpiry;
            emit ContentPurchased(_id, msg.sender, c.price, newExpiry);
        }
    }

    // 🟢 Check access
    function hasAccess(uint256 _id, address _user) public view returns (bool) {
        Content storage c = contents[_id];
        if (c.id == 0) return false;

        // Creator always has access
        if (_user == c.creator) return true;

        // Permanent ownership model
        if (c.accessDuration == 0) {
            return (_user == c.owner);
        }

        // Timed access model
        return block.timestamp < userAccessExpiry[_id][_user];
    }

    // 🟢 Get remaining access time for a user
    function getRemainingTime(uint256 _id, address _user) public view returns (uint256) {
        uint256 expiry = userAccessExpiry[_id][_user];
        if (expiry > block.timestamp) return expiry - block.timestamp;
        return 0;
    }

    // 🟢 Get total content count
    function getContentCount() external view returns (uint256) {
        return _contentIdCounter;
    }

    // 🟢 Admin: update price (optional management helper)
    function updatePrice(uint256 _id, uint256 _newPrice) external {
        Content storage c = contents[_id];
        require(c.creator == msg.sender, "Only creator can update");
        c.price = _newPrice;
    }
}
