## Logging events using Web3 JS:

- Create a web3 provider with metamask:

  ```javascript
  const web3 = new Web3(window.ethereum);
  ```

- Create a web3 contract instance:

  ```javascript
  const web3Contract = new web3.eth.Contract(
    PredictionMarketABI.abi,
    predictionMarket.address
  );
  ```

- set contract provider to web3:

  ```javascript
  web3Contract.setProvider(web3.currentProvider);
  ```

- To get events with filter create filter
  ```javascript
  const options = {
    filter: {
      gambler: signerAddress, //indexed parameter in the solidity event
    },
    fromBlock: 0, //look for events from this block
    toBlock: 'latest', //to this block
  };
  ```
- Get events:

  ```javascript
  const events = await web3Contract.getPastEvents('EventName', options);
  ```

- For getting all the events:

  ```javascript
  const events = await web3Contract.getPastEvents('EventName');
  ```

## Logging events using Ethers JS:

- Create a provider with metamask:

  ```javascript
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  ```

- Create a contract instance:

  ```javascript
  const contract = new ethers.Contract(
    predictionMarket.address,
    PredictionMarketABI.abi,
    provider.getSigner()
  );
  ```

- To listen to an event, inside <code>useEffect()</code> :

  ```javascript
  contract.on('EventName', (event) => {
    console.log(event);
  });
  ```

  - This callback will be triggered when the event is emitted.
  - Also this callback will be triggered for all of the events that are emitted after this particular event is created.
  - To store it in a state variable:

    ```javascript
      const [events, setEvents] = useState([]);
      predictionMarket.on('EventName', async (param1, param2, ..., event) => {
      setEvents((currentTxs) => [
        ...currentTxs,
        {
          txHash: event.transactionHash,
          param1,
          param2,
          ...
        },
      ]);
    });
    ```
