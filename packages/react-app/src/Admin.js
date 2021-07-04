import React, { useState, useEffect } from 'react'
import Web3 from 'web3';
import { addresses, abis } from "@project/contracts";
import { Button } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';


const { ethers } = require("ethers");

function Admin() {
    // store dai in local state
    const [web3, setWeb3] = useState();
    const [pendtxn, setPendtxn] = useState();
    const [pendingWires, setMap] = useState(new Map());

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const wireTransferContract = new ethers.Contract(addresses.wiretransfer, abis.wiretransfer, signer);

    window.mymap = pendingWires;

    useEffect(() => {
        async function fetchData() {
            // Runs after the first render() lifecycle
            var web3 = window.web3;
            if (typeof web3 !== 'undefined') {
                web3 = new Web3(web3.currentProvider);
                let address = (await web3.eth.getAccounts())[0]
                console.log('address:', address);
                setWeb3(web3);

                wireTransferContract.on("CompDeposit", async (_from, _to, _amount, mins, counter) => {
                    const blocktime = (await provider.getBlock()).timestamp;
                    const d = new Date((blocktime + (mins * 60)) * 1000)
                    console.log([_from, _to, _amount.toString(), d.toString(), counter.toString()]);
                    if (!pendingWires.has(counter.toString())) {
                        setMap(pendingWires.set(counter.toString(), [d, (_amount / (10 ** 18)).toString()]));
                    }
                });
            }
        }
        fetchData()
    } , []);


    async function releaseWires(k) {
        // console.log(result);
        // await itx.main(infuraProvider, "releaseWires", [releaseId]);
        console.log('entered releaseWires')
        wireTransferContract.releaseWires(k).then((res) => {
            pendingWires.delete(k);
            console.log('deleted', k, pendingWires);
        });
    }

    async function redeemFeeAndTransfer() {
        // const permitExpiry = "1644562445";
        // const result = await signDaiPermit(web3.currentProvider, addresses.daitoken, address, addresses.wiretransfer, permitExpiry);

        // console.log(result);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner()
        const wireTransferContract = new ethers.Contract(addresses.wiretransfer, abis.wiretransfer, signer);
        await wireTransferContract.redeemFeeAndTransfer();
    }

    async function redeemFeeAndTransfer() {
        // const permitExpiry = "1644562445";
        // const result = await signDaiPermit(web3.currentProvider, addresses.daitoken, address, addresses.wiretransfer, permitExpiry);

        // console.log(result);
        await wireTransferContract.redeemFeeAndTransfer();
    }

    async function swapDaiForEth() {
        // const permitExpiry = "1644562445";
        // const result = await signDaiPermit(web3.currentProvider, addresses.daitoken, address, addresses.wiretransfer, permitExpiry);

        // console.log(result);
        await wireTransferContract.swapDaiForEth();
    }

    async function printPendingWires() {
        const now = new Date();
        setPendtxn(<ul>
            {[...pendingWires.keys()].map(k => (
                // const releasteDate = 
                <li key={k}>[Txn ID: {k}], [Timelock: {pendingWires.get(k)[0].toString()}] [DAI Amount: {pendingWires.get(k)[1]}]
                            [<Button disabled={pendingWires.get(k)[0] > now} onClick={() => releaseWires(k)}>Release</Button>]</li>))}
        </ul>);
    }

    return (
        <div className="App">
            <div className="actions">
                <Button onClick={redeemFeeAndTransfer}>Redeem fee</Button>
                <Button onClick={swapDaiForEth}>Swap fee DAI for ETH</Button>
                <hr />
            </div>
            <div>
                <Button onClick={printPendingWires}>Pending Wires </Button>
                {pendtxn}
            </div>
        </div>
    );
}

export default Admin;
