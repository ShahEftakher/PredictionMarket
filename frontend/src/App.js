import React, { useState, useEffect } from 'react';
import getBlockchain from './ethereum.js';
import { ethers } from 'ethers';
import Web3 from 'web3';
import PredictionMarketABI from './contracts/PredictionMarket.json';

const SIDE = {
  TRUMP: 1,
  BIDEN: 0,
};

function App() {
  const [predictionMarket, setPredictionMarket] = useState(undefined);
  const [betPredictions, setBetPredictions] = useState(undefined);
  const [myBets, setMyBets] = useState(undefined);
  const [txs, setTxs] = useState([]);
  const [userBets, setUserBets] = useState([]);

  useEffect(() => {
    window.ethereum.on('accounrtChanged', () => {
      window.location.reload();
    });
    const init = async () => {
      const { signerAddress, predictionMarket } = await getBlockchain();
      const web3 = new Web3(window.ethereum);
      const web3Contract = new web3.eth.Contract(
        PredictionMarketABI.abi,
        predictionMarket.address
      );

      web3Contract.setProvider(web3.currentProvider);

      console.log(web3Contract);

      const options = {
        filter: {
          gambler: signerAddress,
        },
        fromBlock: 0,
        toBlock: 'latest',
      };
      const result = await web3Contract.getPastEvents('BetPlaced', options);
      console.log(result);
      setUserBets(result);

      const bets = await Promise.all([
        predictionMarket.bets(SIDE.BIDEN),
        predictionMarket.bets(SIDE.TRUMP),
      ]);

      const betPredictions = {
        labels: ['Trump', 'Biden'],
        datasets: [
          {
            data: [bets[1].toString(), bets[0].toString()],
            backgroundColor: ['#FF6384', '#36A2EB'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB'],
          },
        ],
      };
      const myBets = await Promise.all([
        predictionMarket.betsPerGambler(signerAddress, SIDE.BIDEN),
        predictionMarket.betsPerGambler(signerAddress, SIDE.TRUMP),
      ]);
      setMyBets(myBets);
      setBetPredictions(betPredictions);
      setPredictionMarket(predictionMarket);

      predictionMarket.on('BetPlaced', async (gambler, side, amount, event) => {
        setTxs((currentTxs) => [
          ...currentTxs,
          {
            txHash: event.transactionHash,
            gambler,
            side,
            amount: ethers.utils.formatUnits(String(amount), 18),
          },
        ]);
        const result = await web3Contract.getPastEvents('BetPlaced', options);
        console.log(result);
        setUserBets(result);
      });

      predictionMarket.on('ResultUpdated', (result) => {
        console.log(result);
      });

      predictionMarket.on('BetWithdrawn', (sender, amount) => {
        let info = {
          sender,
          amount: ethers.utils.formatUnits(amount, 18),
        };
        console.log(info);
      });
    };
    init();
  }, []);

  if (
    typeof predictionMarket === 'undefined' ||
    typeof betPredictions === 'undefined' ||
    typeof myBets === 'undefined'
  ) {
    return 'Loading...';
  }

  const placeBet = async (side, e) => {
    console.log(e);
    e.preventDefault();
    console.log(ethers.utils.parseEther(e.target.elements[0].value));
    await predictionMarket.placeBet(side, {
      value: ethers.utils.parseEther(e.target.elements[0].value),
    });
    e.target.elements[0].value = '';
  };

  const withdrawGain = async () => {
    await predictionMarket.withdrawGain();
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-sm-12">
          <h1 className="text-center">Prediction Market</h1>
          <div className="jumbotron">
            <h1 className="display-4 text-center">
              Who will win the US election?
            </h1>
            <p className="lead text-center">Current odds</p>
            <div>{/* <Pie data={betPredictions} /> */}</div>
          </div>
        </div>
      </div>

      <div className="row m-3">
        <div className="col-sm-6">
          <div className="card">
            {/* <img src="./img/trump.png" /> */}
            <div className="card-body">
              <h5 className="card-title">Trump</h5>
              <form
                className="form-inline"
                onSubmit={(e) => placeBet(SIDE.TRUMP, e)}
              >
                <input
                  type="text"
                  className="form-control mb-2 mr-sm-2"
                  placeholder="Bet amount (ether)"
                />
                <button type="submit" className="btn btn-primary mb-2">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-sm-6">
          <div className="card">
            {/* <img src="./img/biden.png" /> */}
            <div className="card-body">
              <h5 className="card-title">Biden</h5>
              <form
                className="form-inline"
                onSubmit={(e) => placeBet(SIDE.BIDEN, e)}
              >
                <input
                  type="text"
                  className="form-control mb-2 mr-sm-2"
                  placeholder="Bet amount (ether)"
                />
                <button type="submit" className="btn btn-primary mb-2">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row border shadow p-2 mb-4">
        <h2>Your bets</h2>
        <ul className="col m-2">
          <li>
            Biden: {ethers.utils.formatUnits(myBets[0].toString(), 18)} ETH
          </li>
          <li>
            Trump: {ethers.utils.formatUnits(myBets[1].toString(), 18)} ETH
          </li>
        </ul>
      </div>

      <div className="row border shadow p-2 mb-4">
        <h2>Your bet History</h2>
        <ul className="col m-2">
          {userBets.map((bet) => (
            <li key={bet.transactionHash}>
              {bet.returnValues.gambler} bet {bet.returnValues.amount} ETH on{' '}
              {bet.returnValues.side === SIDE.BIDEN ? 'Biden' : 'Trump'}
            </li>
          ))}
        </ul>
      </div>

      <div className="row border shadow p-2">
        <h2>All Bets</h2>
        <ul className="col m-2">
          {txs.map((tx) => (
            <li key={tx.transactionHash}>
              {tx.gambler} placed {tx.amount} ETH on{' '}
              {tx.side === 1 ? 'Trump' : 'Biden'}
            </li>
          ))}
        </ul>
      </div>

      <div className="row">
        <h2>Claim your gains, if any, after the election</h2>
        <button
          type="submit"
          className="btn btn-primary mb-2"
          onClick={(e) => withdrawGain()}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default App;
