// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import the Ownable contract from the OpenZeppelin library
import "@openzeppelin/contracts/access/Ownable.sol";

// Update our contract to inherit from Ownable.
contract ContentManager is Ownable {

    // Struct to hold content details
    struct Content {
        uint256 id;
        string title;
        address payable creator;
        address payable owner;
        uint256 price;
        bool isForSale;
        string encryptedKeyCID;
    }

    // Mappings and counters
    mapping(uint256 => Content) public contents;
    uint256 private _contentIdCounter;

    // --- NEW ---
    // This mapping will store a true/false value for every file hash.
    // We make it public so the frontend can check for duplicates.
    mapping(bytes32 => bool) public hashExists;
    // --- END NEW ---

    // Events
    event ContentRegistered(uint256 id, string title, address creator, uint256 price);
    event ContentSold(uint256 id, address newOwner, uint256 price);

    // We add a constructor to set the initial owner when the contract is deployed.
    constructor() Ownable(msg.sender) {}

    // --- UPDATED FUNCTION ---
    function registerContent(
        string memory _title, 
        uint256 _price, 
        string memory _encryptedKeyCID,
        bytes32 _fileHash // <-- NEW: Added the file hash as an argument
    ) external {
        
        // --- NEW: Check for duplicate hash ---
        // This is the core of our new feature.
        // It checks the 'hashExists' mapping. If the hash is already 'true', it stops.
        require(!hashExists[_fileHash], "This content has already been uploaded.");
        // --- END NEW ---

        _contentIdCounter++;
        uint256 newId = _contentIdCounter;
        
        // --- NEW: Register the hash ---
        // If the 'require' check passed, we now "burn" the hash by setting it to 'true'.
        hashExists[_fileHash] = true;
        // --- END NEW ---

        // Store the new content
        contents[newId] = Content({
            id: newId,
            title: _title,
            creator: payable(msg.sender),
            owner: payable(msg.sender),
            price: _price,
            isForSale: true,
            encryptedKeyCID: _encryptedKeyCID
        });
        
        // Emit an event
        emit ContentRegistered(newId, _title, msg.sender, _price);
    }
    // --- END OF UPDATED FUNCTION ---


    // --- NO CHANGES TO THE FUNCTIONS BELOW ---

    function purchaseContent(uint256 _id) external payable {
        Content storage contentToBuy = contents[_id];
        require(contentToBuy.id != 0, "Content does not exist.");
        require(contentToBuy.isForSale, "Content is not for sale.");
        require(msg.value >= contentToBuy.price, "Insufficient Ether sent. Please send the exact price.");
        require(msg.sender != contentToBuy.owner, "You already own this content.");
        
        address payable previousOwner = contentToBuy.owner;
        contentToBuy.owner = payable(msg.sender);
        contentToBuy.isForSale = false;
        
        // Send the payment to the previous owner
        previousOwner.transfer(contentToBuy.price);
        
        emit ContentSold(_id, msg.sender, contentToBuy.price);
    }

    function getContentCount() external view returns (uint256) {
        return _contentIdCounter;
    }
}