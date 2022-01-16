import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
//import Web3 from "web3";
import "./App.css";
import abi from "./utils/WavePortal.json";
import ReactCountryFlag from "react-country-flag";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [waveIsMining, setWaveIsMining] = useState(false);
  const [isRinkeby, setIsRinkeby] = useState(true);
  const [userLocation, setUserLocation] = useState([]);

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = "0x10359826301C31c6519c6fC01Ee3A1E4a126DDb8";

  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    /*
     * First make sure we have access to window.ethereum
     */
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the etherum object", ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Implement connectWallet
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        console.log(wavesCleaned);
        setAllWaves(wavesCleaned);

        /**
         * Listen in for emitter events!
         */
        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves((prevState) => [
            ...prevState,
            {
              address: from,
              timestamp: new Date(timestamp * 1000),
              message: message,
            },
          ]);
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        setWaveIsMining(true);
        await waveTxn.wait();
        setWaveIsMining(false);

        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  function setMessageText(e) {
    setMessage(e.target.value);
  }

  const askIsRinkeby = async () => {
    try {
      const { ethereum } = window;
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);

        const info = await provider.getNetwork();
        console.log(info);
        if (info.name !== "rinkeby") {
          console.log(isRinkeby);
          setIsRinkeby(false);
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  function switchNetwork() {
    try {
      const { ethereum } = window;
      if (window.ethereum) {
        // Automatically prompt to change network
        ethereum.request({
          method: "wallet_switchEthereumChain",
          // hardcode the value for Rinkeby network
          params: [{ chainId: "0x4" }],
          // TODO: work out the correct hex code to pass to this method
          // params: [{ chainId: Web3.utils.toHex(40) }],
        });

        // Automatically reload the page when the network is changed!!
        ethereum.on("chainChanged", (chainId) => {
          // Handle the new chain.
          // Correctly handling chain changes can be complicated.
          // We recommend reloading the page unless you have good reason not to.
          window.location.reload();
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  function getFormattedDate(date, prefomattedDate = false, hideYear = false) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    let minutes = date.getMinutes();

    if (minutes < 10) {
      // Adding leading zero to minutes
      minutes = `0${minutes}`;
    }

    if (prefomattedDate) {
      // Today at 10:20
      // Yesterday at 10:20
      return `${prefomattedDate} at ${hours}:${minutes}`;
    }

    if (hideYear) {
      // 10. January at 10:20
      return `${day}. ${month} at ${hours}:${minutes}`;
    }

    // 10. January 2017. at 10:20
    return `${day}. ${month} ${year}. at ${hours}:${minutes}`;
  }
  function timeAgo(dateParam) {
    if (!dateParam) {
      return null;
    }

    const date =
      typeof dateParam === "object" ? dateParam : new Date(dateParam);
    const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
    const today = new Date();
    const yesterday = new Date(today - DAY_IN_MS);
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const isToday = today.toDateString() === date.toDateString();
    const isYesterday = yesterday.toDateString() === date.toDateString();
    const isThisYear = today.getFullYear() === date.getFullYear();

    if (seconds < 5) {
      return "now";
    } else if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (seconds < 90) {
      return "about a minute ago";
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (isToday) {
      return getFormattedDate(date, "Today"); // Today at 10:20
    } else if (isYesterday) {
      return getFormattedDate(date, "Yesterday"); // Yesterday at 10:20
    } else if (isThisYear) {
      return getFormattedDate(date, false, true); // 10. January at 10:20
    }

    return getFormattedDate(date); // 10. January 2017. at 10:20
  }

  function getUserLocation() {
    console.log("getUserLocation");
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((response) => {
        let location;
        if (response.city) {
          location = response.city;
        } else {
          location = response.country;
        }

        console.log("Country: ", response);
        console.log("location: ", location);
        console.log("location: ", response.country_code);

        setUserLocation(() => [
          {
            country: response.country_name,
            countryCode: response.country_code,
          },
        ]);
        console.log(userLocation.country);
      })
      .catch((data, status) => {
        console.log("Request failed");
      });
  }

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  useEffect(() => {
    getUserLocation();
    askIsRinkeby();
    getAllWaves();
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer max-w-4xl p-4">
        <div className="header">
          <img
            className="hi-image mx-auto"
            src="hi-everybody.webp"
            alt="Hi everybody"
          />
        </div>

        <div className="bio my-6">
          <h1 className="mb-3 text-lg font-bold text-gray-600">
            I'm Ben from UK and I'm enjoying learning Solidity with Buildspace!
          </h1>
          <p className="text-sm">
            This is my first web3 dapp on the blockchain. <br />
            Send me a message and you have a 50% chance of winning Ξ0.001!
          </p>
        </div>

        {/* If on Rinkeby network but Wallet not connected then show instructions*/}
        {!isRinkeby && (
          <div className="flex flex-col items-center p-6 bg-white border-2 border-gray-300 bg-gray-100 rounded-xl shadow-md">
            <h3 className="text-xl font-bold">Wrong network!</h3>
            <p className="mt-3 mb-6 text-center">
              You need to connect to the Rinkeby test network to use this app.
            </p>
            <button
              className="waveButton bg-blue-500 hover:bg-blue-700 text-white font-bold p-3 px-6 rounded"
              onClick={switchNetwork}
            >
              Connect to Rinkeby
            </button>
            <p className="mt-6 text-center">
              <small className="text-xs">
                Your real wallet is safe and no real ETH is used in this
                transaction.
              </small>
            </p>
          </div>
        )}

        {/* If on Rinkeby network but Wallet not connected then show instructions*/}
        {isRinkeby && !currentAccount && (
          <button
            className="waveButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-5 px-4 rounded"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        )}

        {/* If connected, show wave box */}
        {isRinkeby && currentAccount && (
          <div className="app-ui">
            <div className=" mb-5 p-6 bg-gray-100 border-2 border-gray-200 rounded-xl shadow-md">
              <div className="text-center">
                <h2 className="text-center font-bold text-xl">
                  Send me a message
                </h2>
                <p className="mb-2">
                  <small>50% chance of winning Ξ0.001</small>
                </p>
              </div>

              <div className="wave-box flex flex-col sm:flex-row items-stretch">
                <input
                  className="wave-box__input my-1 shadow appearance-none border rounded w-full py-2 mr-3 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  value={message}
                  onChange={setMessageText}
                  placeholder="Send me a message"
                />
                <button
                  className="wave-box__btn waveButton my-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={wave}
                >
                  <span role="img" aria-label="Waving hand">
                    👋
                  </span>{" "}
                  Wave at Me
                </button>
              </div>
            </div>

            {waveIsMining && (
              <img className="spinner" src="spinner.gif" alt="Loading..." />
            )}

            <div className="waves p-6 px-8 bg-blue-100 rounded-lg">
              <div className="flex justify-between">
                <h2>Waves received:</h2>
                <p>{allWaves.length} in total</p>
              </div>

              {allWaves
                .slice()
                .reverse()
                .map((wave, index) => {
                  return (
                    <div
                      key={index}
                      className="flex flex-col p-4 my-4 bg-blue-50"
                    >
                      <div>{wave.message}</div>
                      <div className="flex text-sm mt-2 mb-4">
                        <p className="text-xs">
                          ⏱ <span className="text-gray-500">Sent </span>
                          {timeAgo(wave.timestamp).toLowerCase()}
                          <span className="text-gray-500"> from </span>
                          {userLocation.map((location, index) => {
                            return (
                              <span key={index}>
                                {location.country}
                                &nbsp;
                                <ReactCountryFlag
                                  countryCode={location.countryCode}
                                />
                              </span>
                            );
                          })}
                        </p>
                      </div>
                      <div className="flex my-2 hidden">
                        <p>{wave.timestamp.toString()}</p>
                      </div>
                      <code className="text-xs">
                        From address: {wave.address}
                      </code>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
