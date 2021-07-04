const { ethers } = require("ethers");


const bump = [];

const wait = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

function getChainID() {
  console.log('.env: ', process.env);
    switch (process.env.REACT_APP_ETHEREUM_NETWORK) {
        case "mainnet":
        return 1;
        case "kovan":
        return 42;
        case "rinkeby":
        return 4;
        case "goerli":
        return 5;
        case "ropsten":
        return 3;
        default:
        throw new Error("You need to set ETHEREUM_NETWORK in your .env file.");
    }
}
function printBump(txHash, price) {
  if (!bump[txHash]) {
    var etherscanUrl;
    const gasPrice = ethers.utils.formatUnits(
      price,
      "gwei"
    );
    bump[txHash] = true;
    if (process.env.REACT_APP_ETHEREUM_NETWORK != "mainnet") {
      etherscanUrl = `https://${
        process.env.REACT_APP_ETHEREUM_NETWORK
      }.etherscan.io/tx/${txHash}`;
      
      console.log(
        `${etherscanUrl} @ ${gasPrice} gwei`
      );
    } else {
      etherscanUrl = `https://etherscan.io/tx/${txHash}`;
      console.log(
        `${etherscanUrl} @ ${gasPrice} gwei`
      );
    }
    return [etherscanUrl, gasPrice];
  }
}

async function main(provider, contract_func, contract_func_params) {
  // Create a signer instance based on your private key
  console.log(process.env);
  const signer = new ethers.Wallet(process.env.REACT_APP_METAMASK_PRIVATE_KEY, provider);
  console.log(`Signer public address: ${signer.address}`);

  const wire_abi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "CompDeposit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "CompWithdraw",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "WireNow",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "mins",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiry",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        },
        {
          "internalType": "uint8",
          "name": "v",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        }
      ],
      "name": "depositToCompound",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "extractDai",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "redeemFeeAndTransfer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_counter",
          "type": "uint256"
        }
      ],
      "name": "releaseWires",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "swapDaiForEth",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_feeInDai",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiry",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "allowed",
          "type": "bool"
        },
        {
          "internalType": "uint8",
          "name": "v",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        }
      ],
      "name": "wireNow",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

  // Create a contract interface
  const iface = new ethers.utils.Interface(wire_abi);

  console.log('iface', iface);
  // Create the transaction relay request
  const tx = {
    // Address of the contract we want to call
    to: '0x4bD98A6e3F4C6F4e10710a3423227192e87fE71C',
    // Encoded data payload representing the contract method call
    data: iface.encodeFunctionData(contract_func, contract_func_params),
    // An upper limit on the gas we're willing to spend
    gas: "500000",
    // "fast" and "slow" supported.
    schedule: "fast",
  };

  // Sign a relay request using the signer's private key
  // Final signature of the form keccak256("\x19Ethereum Signed Message:\n" + len((to + data + gas + chainId + schedule)) + (to + data + gas + chainId + schedule)))
  // Where (to + data + gas + chainId + schedule) represents the ABI argument encoding of these fields.
  // ITX will check the from address of this signature and deduct balance according to the gas used by the transaction
  const relayTransactionHashToSign = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes", "uint", "uint", "string"],
      [tx.to, tx.data, tx.gas, getChainID(), tx.schedule]
    )
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(relayTransactionHashToSign)
  );

  // Relay the transaction through ITX
  const sentAtBlock = await provider.getBlockNumber(); // Stats

  // fetches an object
  // { relayTransactionHash: string }
  const { relayTransactionHash } = await provider.send("relay_sendTransaction", [
    tx,
    signature,
  ]);
  console.log(`ITX relay transaction hash: ${relayTransactionHash}`);

  // Waiting for the corresponding Ethereum transaction to be mined
  // We poll the relay_getTransactionStatus method for status updates
  // ITX bumps the gas price of your transaction until it's mined,
  // causing a new transaction hash to be created each time it happens.
  // relay_getTransactionStatus returns a list of these transaction hashes
  // which can then be used to poll Infura for their transaction receipts
  console.log("Waiting to be mined...");
  while (true) {
    // fetches an object
    // { receivedTime: string, broadcasts?: [{broadcastTime: string, ethTxHash: string, gasPrice: string}]}
    const {
      receivedTime,
      broadcasts,
    } = await provider.send("relay_getTransactionStatus", [relayTransactionHash]);

    // check each of these hashes to see if their receipt exists and
    // has confirmations
    if (broadcasts) {
      for (const broadcast of broadcasts) {
        const { broadcastTime, ethTxHash, gasPrice } = broadcast;
        const receipt = await provider.getTransactionReceipt(ethTxHash);
        printBump(ethTxHash, gasPrice); // Print bump

        if (receipt && receipt.confirmations && receipt.confirmations > 1) {
          // The transaction is now on chain!
          console.log(`Ethereum transaction hash: ${receipt.transactionHash}`);
          console.log(`Sent at block ${sentAtBlock}`);
          console.log(`Mined in block ${receipt.blockNumber}`);
          console.log(`Total blocks ${receipt.blockNumber - sentAtBlock}`);
          return ethTxHash;
        }
      }
    }
    await wait(1000);
  }
}

module.exports = {
    main
}
