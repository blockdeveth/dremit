//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

// https://github.com/makerdao/dss-interfaces/blob/master/src/dss/DaiAbstract.sol
interface DaiToken {
    function balanceOf(address _addr) external view returns (uint256);
    function transfer(address dst, uint wad) external returns (bool);
    function transferFrom(address src, address dst, uint wad) external returns (bool);

    function approve(address usr, uint wad) external returns (bool);
    function allowance(address _holder, address _spender) external view returns (uint256);
    
    // function declaration from DAI smart contract interface
    // https://github.com/makerdao/dss/blob/master/src/dai.sol#L122
    // https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f#writeContract
    // --- Approve by signature ---
    function permit(address holder, address spender, uint256 nonce, uint256 expiry,
                    bool allowed, uint8 v, bytes32 r, bytes32 s) external;
}

// Compound’s corresponding cToken contract, like cDAI.
interface CErc20 {
    function mint(uint256) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint) external returns (uint);

    function redeemUnderlying(uint) external returns (uint);

    function balanceOf(address owner) external view returns (uint256);
}

interface UniswapV2Router02 {
    function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        returns (uint[] memory amounts);
    function WETH() external pure returns (address);

}

contract WireTransfer is Ownable {
    event WireNow(address, address, uint256);
    event CompDeposit(address, address, uint256, uint256, uint256);
    event CompWithdraw(address, uint256, uint256);

    DaiToken daitoken;
    CErc20 cdaitoken;
    UniswapV2Router02 uniswapRouter;
    address cdaiaddr = 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD;

    struct Receiver {
        address to;
        uint256 daiAmount;
        uint256 releaseTime;
    }
    uint256 counter = 0;
    mapping(uint256 => Receiver) pendingWires;

    constructor() {
        // https://github.com/makerdao/developerguides/blob/master/dai/dai-in-smart-contracts/dai-in-smart-contracts.md
        // for kovan
        daitoken = DaiToken(0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa);

        uniswapRouter = UniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        daitoken.approve(address(uniswapRouter), type(uint256).max);
        // for ganache cli and mainnet
        // daitoken = DaiToken(0x6B175474E89094C44Da98b954EedeAC495271d0F);


        cdaitoken = CErc20(0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD);
        uniswapRouter = UniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    }

    // for immediate wires
    function wireNow(uint256 _feeInDai, address _from, address _to, uint256 _amount,
                    uint256 nonce, uint256 expiry,
                    bool allowed, uint8 v, bytes32 r, bytes32 s) external {
        // https://ethereum.org/en/developers/tutorials/transfers-and-approval-of-erc-20-tokens-from-a-solidity-smart-contract/#the-sell-function
        require(_amount > 0, "Please enter some DAI to send");
        require(_amount > _feeInDai, "DAI amount lower than the fee");
        // DAI faucet on kovan: https://github.com/Daniel-Szego/DAIFaucet
        require(_amount <= daitoken.balanceOf(_from), "You don't have enough DAI tokens in the wallet");

        uint256 allowance = daitoken.allowance(_from, address(this));
        if(allowance < _amount) {
            daitoken.permit(_from, address(this), nonce, expiry, allowed, v, r, s);
        }

        require(daitoken.allowance(_from, address(this)) >= _amount, "Please sign the wallet popup for immediate wire transfer.");

        daitoken.transferFrom(_from, address(this), _feeInDai);
        daitoken.transferFrom(_from, _to, _amount-_feeInDai);

        emit WireNow(_from, _to, _amount);
    }

    function extractDai(uint256 _amount) external onlyOwner {
        daitoken.transfer(owner(), _amount);
    }

    // for immediate wires
    function depositToCompound(uint256 mins, address _from, address _to, uint256 _amount,
                    uint256 nonce, uint256 expiry,
                    bool allowed, uint8 v, bytes32 r, bytes32 s) external returns (uint) {
        // https://ethereum.org/en/developers/tutorials/transfers-and-approval-of-erc-20-tokens-from-a-solidity-smart-contract/#the-sell-function
        require(_amount > 0, "Please enter some DAI to send");
        // DAI faucet on kovan: https://github.com/Daniel-Szego/DAIFaucet
        require(_amount <= daitoken.balanceOf(_from), "You don't have enough DAI tokens in the wallet");
        uint256 allowance = daitoken.allowance(_from, address(this));
        if(allowance < _amount) {
            daitoken.permit(_from, address(this), nonce, expiry, allowed, v, r, s);
        }

        require(daitoken.allowance(_from, address(this)) >= _amount, "Please sign the wallet popup for immediate wire transfer");

        daitoken.transferFrom(_from, address(this), _amount);
        daitoken.approve(cdaiaddr, _amount);
        // uint mintResult = cdaitoken.mint(_amount);
        cdaitoken.mint(_amount);

        // require(mintResult == 0, "Deposit to Compound failed");

        counter++;
        pendingWires[counter] = Receiver(_to, _amount, block.timestamp + (mins * 1 minutes));

        emit CompDeposit(_from, _to, _amount, mins, counter);
        return counter;
    }


    function releaseWires(uint256 _counter) external {
        require(pendingWires[_counter].daiAmount > 0, "no DAI to send");
        require(pendingWires[_counter].releaseTime <= block.timestamp, "Try to send DAI later");

        Receiver memory rec = pendingWires[_counter];
        uint redeemResult = cdaitoken.redeemUnderlying(rec.daiAmount);
        require(redeemResult == 0, "Redeem from Compound failed");
        daitoken.transfer(rec.to, rec.daiAmount);

        emit CompWithdraw(rec.to, rec.daiAmount, _counter);
        delete pendingWires[_counter];
    }

    function redeemFeeAndTransfer() external onlyOwner {
        cdaitoken.redeem(cdaitoken.balanceOf(address(this)));
        daitoken.transfer(owner(), daitoken.balanceOf(address(this)));
    }

    function swapDaiForEth() external onlyOwner {
        address[] memory path = new address[](2);
        path[0] = address(daitoken);
        path[1] = uniswapRouter.WETH();
        uniswapRouter.swapExactTokensForETH(daitoken.balanceOf(address(this)), 0, path, owner(), block.timestamp);
    }
}
