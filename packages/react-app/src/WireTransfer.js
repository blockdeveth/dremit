import React, { useState, useEffect } from 'react'
import Web3 from 'web3';
import { addresses, abis } from "@project/contracts";
import { signDaiPermit } from 'eth-permit';
import { Button, Form, Header, Icon, Modal } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';


const { ethers } = require("ethers");
const itx = require('./itx')

function WireTransfer() {
    // store dai in local state
    const [daiValue, setDaiValue] = useState();
    const [address, setAddress] = useState();
    const [to_address, setToAddress] = useState();
    const [loading, setLoading] = useState(false);
    const [etherscanUrl, setUrl] = useState();
    const [userReceipt, setReceipt] = useState();

    const [web3, setWeb3] = useState();
    const [infuraProvider, setInfuraProvider] = useState();

    useEffect(() => {
        async function fetchData() {
            // Runs after the first render() lifecycle
            var web3 = window.web3;
            if (typeof web3 !== 'undefined') {
                web3 = new Web3(web3.currentProvider);
                let address = (await web3.eth.getAccounts())[0]
                console.log('address:', address);
                setAddress(address);
                setWeb3(web3);

                setInfuraProvider(new ethers.providers.InfuraProvider(
                    process.env.REACT_APP_ETHEREUM_NETWORK,
                    process.env.REACT_APP_INFURA_PROJECT_ID
                ));
            }
        }
        fetchData()
    } , []);


    // call the wireNow function in WireTransfer smart contract
    async function wireNow() {
        setLoading(true);

        const permitExpiry = "1644562445";
        const result = await signDaiPermit(web3.currentProvider, addresses.daitoken, address, addresses.wiretransfer, permitExpiry);

        console.log('result: ', result);
        const txHash = await itx.main(infuraProvider, "wireNow", ["20000000000000000", address, to_address, daiValue, result.nonce, permitExpiry, true, result.v, result.r, result.s]);
        alert(`Proof: https://kovan.etherscan.io/tx/${txHash}`);
        // setReceipt('Congratulations! Money sent 🥳');
        // console.log({userReceipt});
        setLoading(false);
    }

    async function depositToCompound() {
        setLoading(true);
        const permitExpiry = "1644562445";
        const result = await signDaiPermit(web3.currentProvider, addresses.daitoken, address, addresses.wiretransfer, permitExpiry);

        console.log(result);
        
        const txHash = await itx.main(infuraProvider, "depositToCompound", [3, address, to_address, daiValue, result.nonce, permitExpiry, true, result.v, result.r, result.s]);
        alert(`Proof: https://kovan.etherscan.io/tx/${txHash}`);
        // setReceipt('Congratulations! No fee charged 🎉');
        setLoading(false);
    }

    return (
        <div className="App">
            <Form loading={loading}>
                <Form.Field>
                    <input onChange={e => setDaiValue(String(e.target.value * (10 ** 18)))} placeholder="Enter DAI" /><br />
                </Form.Field>
                <Form.Field>
                    <input onChange={e => setToAddress(e.target.value)} placeholder="Enter receiver address" /><br />
                </Form.Field>
                <Form.Field>
                    <Button onClick={wireNow}>Wire Now 🏁</Button>
                    <Button onClick={depositToCompound}>Wire Later 💰</Button><br />
                </Form.Field>
            </Form>
        </div>
    );
}

export default WireTransfer;
