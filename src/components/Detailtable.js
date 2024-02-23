import { useCallback, useEffect, useState} from "react";
import { connect } from "react-redux";
import { ethers/*, BigNumber*/ } from 'ethers'
import validator from 'validator';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
import {reactLocalStorage} from 'reactjs-localstorage';
import ReactHtmlParser from 'react-html-parser';
import config from '../config.js'
import '../style/style.css'
import { Promise } from 'bluebird';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LineChart from "./Chart.js";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;
//const NETWORK_URL = "https://twilight-autumn-sky.bsc.quiknode.pro/1085e5a615dcd07068888c33d076d0f7842e01e7/";
const NETWORK_URL = "https://bsc-dataseed1.binance.org/"

let WALLET_ADDR = "";
let JWT_TOKEN = reactLocalStorage.get('apiKey')
function mapStateToProps(state) {
  WALLET_ADDR = state.walletAddr;
  return { walletAddr: state.walletAddr, tokenInfo: state.tokenInfo };
};

function DetailTable({ walletAddr, tokenInfo }) {
  const [tableToggle, setTableToggle] = useState(1)
  const toggleAlert = () => { setTableToggle(1) }
  const toggleWallet = () => {
    setTableToggle(0);
    //getTokenTransferEvent();
  }
  const [fetching, setFetching] = useState(false);
  const [tokenTransList, setTokenTransList] = useState([]);
  const [cacheTokenTransList, setCacheTokenTransList] = useState([])
  const [delModalShow, setDelModalShow] = useState(false);
  const [editModalShow, setEditModalShow] = useState(false);
  const [addModalShow, setAddModalShow] = useState(false);
  const [msgModalShow, setMsgModalshow] = useState(false);
  const [loadingModalShow, setLoadingModalShow] = useState(false);
  const [channelModalShow, setChannelModalShow] = useState(0);
  const [alertList, setAlertList] = useState([]);
  const [alertToken, setAlertToken] = useState([]);
  const [alertId, setAlertId] = useState('0000000');
  const [alertPrice, setAlertPrice] = useState(0);
  const [strPrice, setStrPrice] = useState('0');
  const [alertWhen, setAlertWhen] = useState(0);
  const [alertChannel, setAletChannel] = useState([]);
  const [alertTime, setAlertTime] = useState(0);
  const [notifyRecent, setNotifyRecent] = useState(0);
  const [notifySmsDelayed, setNotifySmsDelayed] = useState(0)
  const [notifyCallDelayed, setNotifyCallDelayed] = useState(0)
  const [notifyEmail, setNotifiyEmail] = useState('');
  const [notifySMS, setNotifiySMS] = useState('');
  const [notifyCall, setNotifiyCall] = useState('');
  const [notifyWebhook, setNotifiyWebhook] = useState('');
  const [notifyEmailPrev, setNotifiyEmailPrev] = useState('');
  const [notifySMSPrev, setNotifiySMSPrev] = useState('');
  const [notifyCallPrev, setNotifiyCallPrev] = useState('');
  const [notifyWebhookPrev, setNotifiyWebhookPrev] = useState('');
  const [defaultNotify, setDefaultNotify] = useState(0);
  const [overwriteNotify, setOverwriteNotify] = useState(0);
  const [delToken, setDelToken] = useState({});
  const [hidden, setHidden] = useState(true)

  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const [nameSort, setNameSort] = useState('sorting');
  const [priceSort, setPriceSort] = useState('sorting');
  const [actionSort, setActionSort] = useState('sorting');

  const [nameSortInWallet, setNameSortInWallet] = useState('sorting');
  //const [symbolSortInWallet, setSymbolSortInWallet] = useState('sorting');
  //const [bnbPriceSortInWallet, setBnbPriceSortInWallet] = useState('sorting');
  const [priceSortInWallet, setPriceSortInWallet] = useState('sorting');
  const [balanceSortInWallet, setBalanceSortInWallet] = useState('sorting');
  const [totalSortInWallet, setTotalSortInWallet] = useState('sorting');

  const [copiedHidden, setCopiedHidden] = useState(true);
  const [ownTopTier, setOwnTopTier] = useState('');
  /*const [maxAlert, setMaxAlert] = useState(0);
  const [maxEmail, setMaxEmail] = useState(0);
  const [maxSms, setMaxSms] = useState(0);
  const [maxCall, setMaxCall] = useState(0);*/
  const [tierInfo, setTierInfo] = useState({})
  const [emailTier, setEmailTier] = useState(false)
  const [smsTier, setSmsTier] = useState(false)
  const [callTier, setCallTier] = useState(false)
  const [webhookTier, setWebhookTier] = useState(false)
  const [priceList, setPriceList] = useState([])
  const [lastprice, setLastPrice] = useState(0)
  const [edit, setEdit] = useState(false)
  const [scamTokens, setScamTokens] = useState({})
  const [usdValList, setUsdValList] = useState([])
  const [maxDays, setMaxDays] = useState(15);
  const [maxPossibleDays, setMaxPossibleDays] = useState(365);
  const [divWidth, setDivWidth] = useState(300)
  let scamTokenList = []
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      setDivWidth(300)
    } else if (window.innerWidth < 900 && window.innerWidth >= 400) {
      setDivWidth(190)
    } else if (window.innerWidth < 400) {
      setDivWidth(165)
    }
  })

  let hiddenArr = []

  function millisecToDate(milliSec) {
    const dateLast = new Date(milliSec)
    return dateLast.toString();
  }

  function onCopy(timeout) {
    navigator.clipboard.writeText(alertToken[1])
    setCopiedHidden(false);
    setTimeout(() => {
      setCopiedHidden(true)
    }, timeout);
  }

  function sortAlert() {
    if (nameSort === "sorting_desc" || nameSort === "sorting_asc") {
      sortByName();
    } else if (priceSort === "sorting_desc" || priceSort === "sorting_asc") {
      sortByPrice();
    } else if (actionSort === "sorting_desc" || actionSort === "sorting_asc") {
      sortByAction();
    }
  }

  useEffect(() => {
    sortAlert();
    if(alertList.length > 0)
      getUSDPrice(alertList)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertList.length])

  
  
  async function getPortfolioData(wallet, width, tokenTransList, scamTokens) {
    let totalPrice = 0
    let res = await fetch(SERVER_URL + "/value", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: wallet})
    })
    res = await res.json();
    if (res && res.status) {
      tokenTransList.map((value) => {
        if(scamTokens[value.contractAddress] === false) {
          // console.log(value.tokenPriceUSD, value.balance)
          value.tokenPriceUSD = value.tokenPriceUSD ? value.tokenPriceUSD : 0
          value.balance = value.balance ? value.balance : 0
          totalPrice += value.tokenPriceUSD * value.balance
        }
      })
      res = res.message.walletValue;
      res.map((value) => {
        for(let i = 0; i < tokenTransList.length; i++) {
          if(value[tokenTransList[i].contractAddress]) {
            if(scamTokens[tokenTransList[i].contractAddress] === true) {
              delete value[tokenTransList[i].contractAddress]
            }
          }
        }
      })
      
      let finalRes = []
      
      res.map((value) => {
        let val = 0;
        for(let i = 0; i < tokenTransList.length; i++) {
          if(value[tokenTransList[i].contractAddress]) {
            val += value[tokenTransList[i].contractAddress]
          }
        }
        finalRes.push(val)
      })
      setPriceList(finalRes)
      setLastPrice(totalPrice)
    }
  }
  function sortByName() {
    let sort = (nameSort === "sorting_desc") ? 0 : 1;
    const update = [...alertList].sort(
      function(a, b){
        let x = a.tokenName.toLowerCase();
        let y = b.tokenName.toLowerCase();
        if (x < y) {return (sort === 0) ? -1 : 1;}
        if (x > y) {return (sort === 0) ? 1 : -1;}
        return 0;
      }
    );
    setAlertList(update)

    if (nameSort === "sorting_desc") {
      setNameSort("sorting_asc");
      setPriceSort("sorting");
      setActionSort("sorting");
    } else {
      setNameSort("sorting_desc");
      setPriceSort("sorting");
      setActionSort("sorting");
    }
  }

  function sortByPrice() {
    let sort = (priceSort === "sorting_desc") ? 0 : 1;
    const update = [...alertList].sort(
      function(a, b){return (sort === 0) ? a.price - b.price : b.price - a.price}
    );
    setAlertList(update)

    if (priceSort === "sorting_desc") {
      setPriceSort("sorting_asc");
      setNameSort("sorting");
      setActionSort("sorting");
    } else {
      setPriceSort("sorting_desc");
      setNameSort("sorting");
      setActionSort("sorting");
    }
  }

  function sortByAction() {
    let sort = (actionSort === "sorting_desc") ? 0 : 1;
    const update = [...alertList].sort(
      function(a, b){return (sort === 0) ? a.status - b.status : b.status - a.status}
    );
    setAlertList(update)

    if (actionSort === "sorting_desc") {
      setActionSort("sorting_asc");
      setPriceSort("sorting");
      setNameSort("sorting");
    } else {
      setActionSort("sorting_desc");
      setPriceSort("sorting");
      setNameSort("sorting");
    }
  }

  function sortByNameInWallet() {
    let sort = (nameSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){
        let x = a.tokenName.toLowerCase();
        let y = b.tokenName.toLowerCase();
        if (x < y) {return (sort === 0) ? -1 : 1;}
        if (x > y) {return (sort === 0) ? 1 : -1;}
        return 0;
      }
    );
    setTokenTransList(update)

    if (nameSortInWallet === "sorting_desc") {
      setNameSortInWallet("sorting_asc");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    } else {
      setNameSortInWallet("sorting_desc");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    }
  }

  /*function sortBySymbolInWallet() {
    let sort = (symbolSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){
        let x = a.tokenSymbol.toLowerCase();
        let y = b.tokenSymbol.toLowerCase();
        if (x < y) {return (sort === 0) ? -1 : 1;}
        if (x > y) {return (sort === 0) ? 1 : -1;}
        return 0;
      }
    );
    setTokenTransList(update)

    if (symbolSortInWallet === "sorting_desc") {
      setSymbolSortInWallet("sorting_asc")
      setNameSortInWallet("sorting");
      setBnbPriceSortInWallet("sorting")
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    } else {
      setSymbolSortInWallet("sorting_desc")
      setNameSortInWallet("sorting");
      setBnbPriceSortInWallet("sorting")
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    }
  }

  function sortByBnbPriceInWallet() {
    let sort = (bnbPriceSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){return (sort === 0) ? a.tokenPriceBNB - b.tokenPriceBNB : b.tokenPriceBNB - a.tokenPriceBNB}
    );
    setTokenTransList(update)

    if (bnbPriceSortInWallet === "sorting_desc") {
      setBnbPriceSortInWallet("sorting_asc")
      setNameSortInWallet("sorting");
      setSymbolSortInWallet("sorting")
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    } else {
      setBnbPriceSortInWallet("sorting_desc")
      setNameSortInWallet("sorting");
      setSymbolSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting");
    }
  }*/

  function sortByPriceInWallet() {
    let sort = (priceSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){return (sort === 0) ? a.tokenPriceUSD - b.tokenPriceUSD : b.tokenPriceUSD - a.tokenPriceUSD}
    );
    setTokenTransList(update)

    if (priceSortInWallet === "sorting_desc") {
      setPriceSortInWallet("sorting_asc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    } else {
      setPriceSortInWallet("sorting_desc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
      setTotalSortInWallet("sorting")
    }
  }

  function sortByBalanceInWallet() {
    let sort = (balanceSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){return (sort === 0) ? a.balance - b.balance : b.balance - a.balance}
    );
    setTokenTransList(update)

    if (balanceSortInWallet === "sorting_desc") {
      setBalanceSortInWallet("sorting_asc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setTotalSortInWallet("sorting");
    } else {
      setBalanceSortInWallet("sorting_desc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setTotalSortInWallet("sorting");
    }
  }

  function sortByTotalInWallet() {
    let sort = (totalSortInWallet === "sorting_desc") ? 0 : 1;
    const update = [...tokenTransList].sort(
      function(a, b){return (sort === 0) ? a.balance * a.tokenPriceUSD - b.balance * b.tokenPriceUSD : b.balance * b.tokenPriceUSD - a.balance * a.tokenPriceUSD}
    );
    setTokenTransList(update)

    if (totalSortInWallet === "sorting_desc") {
      setTotalSortInWallet("sorting_asc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
    } else {
      setTotalSortInWallet("sorting_desc");
      setNameSortInWallet("sorting");
      //setSymbolSortInWallet("sorting");
      //setBnbPriceSortInWallet("sorting");
      setPriceSortInWallet("sorting");
      setBalanceSortInWallet("sorting");
    }
  }

  async function getAlertList() {
    let res = await fetch(SERVER_URL + "/alerts", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr})
    })

    res = await res.json();

    if (res.status === true && res.message !== undefined) {
      let alList = res.message;
      let update = [];
      if (nameSort === "sorting_desc" || nameSort === "sorting_asc") {
        let sort = (nameSort === "sorting_desc") ? 1 : 0;
        update = [...alList].sort(
          function(a, b){
            let x = a.tokenName.toLowerCase();
            let y = b.tokenName.toLowerCase();
            if (x < y) {return (sort === 0) ? -1 : 1;}
            if (x > y) {return (sort === 0) ? 1 : -1;}
            return 0;
          }
        );
      } else if (priceSort === "sorting_desc" || priceSort === "sorting_asc") {
        let sort = (priceSort === "sorting_desc") ? 1 : 0;
        update = [...alList].sort(
          function(a, b){return (sort === 0) ? a.price - b.price : b.price - a.price}
        );
      } else if (actionSort === "sorting_desc" || actionSort === "sorting_asc") {
        let sort = (actionSort === "sorting_desc") ? 1 : 0;
        update = [...alList].sort(
          function(a, b){return (sort === 0) ? a.status - b.status : b.status - a.status}
        );
      } else {
        update = alList;
      }
      setAlertList(update);
    } else {
      setAlertList([])
    }

    /* let tokenAddrList = []
    res.message.map((value) => {
      tokenAddrList.push(value.tokenAddr)
    })

    console.log(tokenAddrList)*/

    let resPrice = await await fetch(SERVER_URL + "/price", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'})
    })

    resPrice = await resPrice.json();

  }

  async function getTokenTransferEvent(forCache, walletAddr) {
    console.log(walletAddr)
    let response;
    try{
      response = await fetch('https://api.bscscan.com/api?module=account&action=tokentx&address=' + walletAddr + '&startblock=0&endblock=10000000&sort=asc&apikey=PYY3JG4KIQEVNWPAQEGPTW51GDYC2EFCUN', {
        method: 'GET',
      })
    } catch(err) {
      console.log('invalid api call')
      return;
    }
    response = await response.json()
    // if (response.message === "OK") {
      let transArr = []
      let respBnbBal = await fetch('https://api.bscscan.com/api?module=account&action=balance&address=' + walletAddr + '&apikey=PYY3JG4KIQEVNWPAQEGPTW51GDYC2EFCUN', {
        method: 'GET',
      })
      respBnbBal = await respBnbBal.json()
      if (respBnbBal.message === "OK") {
        transArr.push({contractAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', tokenName: 'BNB', tokenSymbol: 'BNB', balance: Number(respBnbBal.result) / Math.pow(10, 18)});
      }
      for (let index = 0; index < response.result.length; index++) {
        const element = response.result[index];
        let already = false;
        for (let j = 0; j <= index - 1; j++) {
          if (element.contractAddress === response.result[j].contractAddress) {
            already = true;
            break;
          }
        }
        if (already === false) {
          let res = await fetch(SERVER_URL + "/alerts/read", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authent': JWT_TOKEN
            },
            body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: element.contractAddress })
          })
          res = await res.json()

          if (res.status === true && res.message !== undefined) {
            const alarm = { price: res.message.price, when: res.message.when, channel: res.message.channel, time: res.message.time, status: res.message.status };
            element.alarm = alarm
          }
          transArr.push(element)
        }
      }
      if (forCache === true) {
        setCacheTokenTransList(transArr)
        let savedDate = new Date();
        reactLocalStorage.set('walletInfo', JSON.stringify({savedDate: savedDate.getTime(), walletAddr: walletAddr, walletInfo: transArr}));
        addPriceToTokenList(transArr, true)
      } else {
        // console.log('131231')
        setTokenTransList(transArr)
      }
      
   /*  } else {
      if (forCache === true) {
        setCacheTokenTransList([])
      } else {
        console.log('asdasd')
        setTokenTransList([])
      }
    } */
  }

  /*async function addBalanceToTokenList(transArr) {
    let arry = [];
    for (let index = 0; index < transArr.length; index++) {
      const element = transArr[index];
      await fetch('https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=' + element.contractAddress + '&address=' + walletAddr + '&tag=latest&apikey=PYY3JG4KIQEVNWPAQEGPTW51GDYC2EFCUN', {
        method: 'GET',
      }).then(res => res.json()
      ).then(val => {
        if(val.message === "OK") {
          element.balance = Number(val.result) / Math.pow(10, Number(element.tokenDecimal));
        } else {
          element.balance = -1;
        }
      })
      if (element.balance > 0)
          arry.push(element)
    }
    addPriceToTokenList(arry);
  }*/
  
  const getUSDPrice = async (tokenAddr) => {
    let priceArr = []
    const data = {
      WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', //wbnb
      BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
    }
    const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
    const factory = new ethers.Contract(
      data.factory,
      [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)'
      ],
      provider
    );
    const router = new ethers.Contract(
      data.router,
      [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      ],
      provider
    );
    let wBnbAmounts;
    try {
      wBnbAmounts = await router.getAmountsOut('1000000000000000000', [data.WBNB, data.BUSD]);
    } catch(err) {
      wBnbAmounts = [0,0];
    }
    const wBnbPrice = wBnbAmounts[1] * 1e-18;
    let pairAddress;
    let decimal;
    let USDPrice;
    Promise.map(tokenAddr, async (value) => {
      const token = new ethers.Contract(
        value.tokenAddr,
        [
          'function decimals() external view returns (uint8)',
          'function symbol() external view returns (string memory)'
        ],
        provider
      );
      if (value.tokenAddr.toLowerCase() === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
        USDPrice = wBnbPrice;
        priceArr.push(USDPrice)
        return
      }

      try {
        pairAddress = await factory.getPair(data.WBNB, value.tokenAddr)
      } catch(err) {
        pairAddress = null;
      }
      if(pairAddress !== null && pairAddress !== 'undefined') {
        if (pairAddress.toString().indexOf('0x0000000000000') > -1) {
          USDPrice = 0
          priceArr.push(USDPrice)
          return 
        }
        try {
          decimal = await token.decimals();
        } catch (error) {
          decimal = 1;
        }
    
        let input = "1";
        for (let i = 0; i < decimal; i++) {
          input += "0"
        }
    
        let tokenAmounts;
        try {
          tokenAmounts = await router.getAmountsOut(input, [value.tokenAddr, data.WBNB]);
        } catch (error) {
          tokenAmounts = [0,0];
        }
        const tokenPrice = tokenAmounts[1] * 1e-18;
        USDPrice =  tokenPrice * wBnbPrice;
        priceArr.push(USDPrice)
        return 
      }
      
    })
    setUsdValList(priceArr)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addPriceToTokenList = useCallback(async (transArr, forCache) => {
    let arry = [];
    const data = {
      WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', //wbnb
      BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
    }
    
    const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
    const factory = new ethers.Contract(
      data.factory,
      [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)'
      ],
      provider
    );

    const router = new ethers.Contract(
      data.router,
      [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      ],
      provider
    );

    let wBnbAmounts;
    try {
      wBnbAmounts = await router.getAmountsOut('1000000000000000000', [data.WBNB, data.BUSD]);
    } catch(err) {
      wBnbAmounts = [0,0];
    }

    const wBnbPrice = wBnbAmounts[1] * 1e-18;
    //console.log('WBNB per BUSD:', wBnbPrice);

    for (let index = 0; index < transArr.length; index++) {
      if (WALLET_ADDR === "Connect") {
        setCacheTokenTransList([])
        setTokenTransList([])
        return;
      }

      const element = transArr[index]

      if (element.contractAddress?.toLowerCase() === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
        element.tokenPriceUSD = wBnbPrice;
        let fetchedTime = new Date();
        element.fetchedTime = fetchedTime.getTime();
        element.tokenPriceBNB = 1;
        arry.push(element)
        continue;
      }

      let res = await fetch('https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=' + element.contractAddress + '&address=' + walletAddr + '&tag=latest&apikey=PYY3JG4KIQEVNWPAQEGPTW51GDYC2EFCUN', {
        method: 'GET',
      })
      res = await res.json();
      if(typeof(element) != "object") element = {}
      if (res.message === "OK") {
        element.balance = Number(res.result) / Math.pow(10, Number(element.tokenDecimal));
      } else {
        element.balance = -1;
      }

      if (element.balance <= 0) {
        if (forCache === true) {
          setCacheTokenTransList(cacheTokenTransList.filter(item => item.contractAddress !== element.contractAddress))
        } else {
          setTokenTransList(tokenTransList.filter(item => item.contractAddress !== element.contractAddress));
        }
        
        continue;
      }

      let pairAddress;
      try {
        pairAddress = await factory.getPair(data.WBNB, element.contractAddress);
      } catch (err) {
        pairAddress = null;
      }
      //console.log('pair address:', pairAddress)
      if (pairAddress !== null && pairAddress !== undefined) {
        if (pairAddress.toString().indexOf('0x0000000000000') > -1) {
          //console.log(`no liquidity added`);
          element.tokenPriceBNB = 0;
          element.tokenPriceUSD = 0;
          let fetchedTime = new Date();
          element.fetchedTime = fetchedTime.getTime();
          continue;
        }

        let input = "1";
        for (let i = 0; i < element.tokenDecimal; i++) {
          input += "0"
        }

        let tokenAmounts;
        try {
          tokenAmounts = await router.getAmountsOut(input, [element.contractAddress, data.WBNB]);
        } catch (error) {
          tokenAmounts = [0,0];
        }
   
        const tokenPrice = tokenAmounts[1] * 1e-18;
        element.tokenPriceBNB = tokenPrice;
        //console.log('token per WBNB', tokenPrice);
        //console.log('Token Price', tokenPrice * wBnbPrice);
        /*const val = BigNumber.from(wBnbPrice).mul(BigNumber.from(tokenAmounts[1])).div(BigNumber.from("1000000000000000000"))
        console.log('value!!!!!!!!!!', val)*/
        element.tokenPriceUSD = tokenPrice * wBnbPrice;
        let fetchedTime = new Date();
        element.fetchedTime = fetchedTime.getTime();
      }
      arry.push(element)
    }
    if (WALLET_ADDR !== "Connect") {
      setTokenTransList(arry);
      //console.log(arry)
      let savedDate = new Date();
      reactLocalStorage.set('walletInfo', JSON.stringify({savedDate: savedDate.getTime(), walletAddr: walletAddr, walletInfo: arry}));
    } else {
      setTokenTransList([])
    }

  });

  async function setMembership() {
    //get balance of tier_token_address and tier_lp_address
    let res = await fetch(SERVER_URL + "/tierinfo", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr})
    })
    res = await res.json()
    if (res.status) {
      const tierInformation = res.message;
      setTierInfo(tierInformation)
      if (tierInformation.max_possible_days) {
        setMaxPossibleDays(tierInformation.max_possible_days)
      }
      const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
      setLoadingModalShow(true);
      try {
        const tierToken = new ethers.Contract(
          tierInformation.tier_token_address,
          [
            'function balanceOf(address acount) external view returns (uint256)',
          ],
          provider
        );
        const tierLp = new ethers.Contract(
          tierInformation.tier_lp_address,
          [
            'function balanceOf(address acount) external view returns (uint256)',
          ],
          provider
        );
        let tierTokenBal = await tierToken.balanceOf(walletAddr)
        let tierLpBal = await tierLp.balanceOf(walletAddr)
        let topTier = ''
        if (tierTokenBal >= tierInformation[tierInformation.email_tier + '_min_tokens'] && tierLpBal >= tierInformation[tierInformation.email_tier + '_min_lp']) {
          setEmailTier(true)
          if (topTier === '' || tierInformation[tierInformation.email_tier + '_max_alerts_total'] > tierInformation[topTier + '_max_alerts_total']) {
            topTier = tierInformation.email_tier
          }
        } else {
          setEmailTier(false)
        }

        if (tierTokenBal >= tierInformation[tierInformation.sms_tier + '_min_tokens'] && tierLpBal >= tierInformation[tierInformation.sms_tier + '_min_lp']) {
          setSmsTier(true)
          if (topTier === '' || tierInformation[tierInformation.sms_tier + '_max_alerts_total'] > tierInformation[topTier + '_max_alerts_total']) {
            topTier = tierInformation.sms_tier
          }
        } else {
          setSmsTier(false)
        }

        if (tierTokenBal >= tierInformation[tierInformation.call_tier + '_min_tokens'] && tierLpBal >= tierInformation[tierInformation.call_tier + '_min_lp']) {
          setCallTier(true)
          if (topTier === '' || tierInformation[tierInformation.call_tier + '_max_alerts_total'] > tierInformation[topTier + '_max_alerts_total']) {
            topTier = tierInformation.call_tier
          }
        } else {
          setCallTier(false)
        }

        if (tierTokenBal >= tierInformation[tierInformation.webhook_tier + '_min_tokens'] && tierLpBal >= tierInformation[tierInformation.webhook_tier + '_min_lp']) {
          setWebhookTier(true)
          if (topTier === '' || tierInformation[tierInformation.webhook_tier + '_max_alerts_total'] > tierInformation[topTier + '_max_alerts_total']) {
            topTier = tierInformation.webhook_tier
          }
        } else {
          setWebhookTier(false)
        }

        setOwnTopTier(topTier);
      } catch (error) {
        console.log(error)
      }
      setLoadingModalShow(false);
    }
    
    /*const token = new ethers.Contract(
      tier_token_address,
      [
        'function decimals() external view returns (uint8)',
        'function symbol() external view returns (string memory)'
      ],
      provider
    );

    if (e.tokenSymbol === undefined) {
      e.tokenSymbol = await token.symbol();
    }*/
  }

  useEffect(() => {
    if (walletAddr === 'Connect' || walletAddr === "") {
      setAlertList([]);
      setTokenTransList([]);
    } else {
      let scamList = window.localStorage.getItem("scamList");
      if (scamList) {
        let scamObj = JSON.parse(scamList);
        setScamTokens(scamObj)      
      }

      JWT_TOKEN = reactLocalStorage.get('apiKey')
      getAlertList();
      let walletInfoCached = reactLocalStorage.get('walletInfo')
      if (walletInfoCached) {
        let currDate = new Date();
        
        let obj = JSON.parse(walletInfoCached)
        // console.log('obj', obj, walletAddr, currDate.getTime() - obj.savedDate)
        if (obj.walletAddr === walletAddr && obj.savedDate && (currDate.getTime() - obj.savedDate) < 600000) {
          // console.log('123123', obj.walletInfo)
          setFetching(false);
          setTokenTransList(obj.walletInfo)
        } else {
          // console.log('ffff')
          setFetching(true)
          getTokenTransferEvent(false, walletAddr);  
        }
      } else {
        setFetching(true)
        getTokenTransferEvent(false, walletAddr);
      }

      setMembership()

      const idTokenTransfer = setInterval(() => {
        getTokenTransferEvent(true, walletAddr)
      }, 600000);

      

      return () => {
        clearInterval(idTokenTransfer);
        
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddr])

  useEffect(() => {
    if (walletAddr !== "Connect" && walletAddr !== "" && divWidth && tokenTransList && scamTokens) {
      getPortfolioData(walletAddr, divWidth, tokenTransList, scamTokens)
      const idAlertList = setInterval(() => {
        getAlertList();
      }, 60000 * 60 * 24);
      return () => {
        clearInterval(idAlertList);
      }
    }
  }, [walletAddr, divWidth, tokenTransList, lastprice, scamTokens])
  


  useEffect(() => {
    if (tokenInfo !== undefined && tokenInfo.addr !== undefined && tokenInfo.name !== undefined && walletAddr !== "Connect") {
      addNewAlert({contractAddress: tokenInfo.addr, tokenName: tokenInfo.name})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenInfo])

  useEffect(() => {
    if (tokenTransList.length > 0 && fetching === true) {
      setFetching(false);
      addPriceToTokenList(tokenTransList, false)
    }
    //addBalanceToTokenList(tokenTransList);
  }, [tokenTransList, addPriceToTokenList, fetching])
  
  function closeAlert() {
    if (editModalShow === true) {
      setEditModalShow(false)
    } else if (addModalShow === true) {
      setAddModalShow(false)
    }
  }

  async function saveAlert() {
    //if no channels are checked
    if (alertChannel.length <= 0) {
      toastMessage("At least one channel should be checked before an alert is created.", 1500)
      return;
    }

    //when saving alert, check again if channels are valid
    if (alertChannel.indexOf(0) >= 0 && !emailTier) {
      return;
    }
    if (alertChannel.indexOf(1) >= 0 && !webhookTier) {
      return;
    }
    if (alertChannel.indexOf(2) >= 0 && !smsTier) {
      return;
    }
    if (alertChannel.indexOf(3) >= 0 && !callTier) {
      return;
    }

    //check again if exceeds max_feature_limit
    /*if (alertChannel.indexOf(0) >= 0 && alertList.length >= tierInfo[tierInfo.email_tier + '_max_email_alerts']) {
      return;
    }
    if (alertChannel.indexOf(1) >= 0 && alertList.length >= tierInfo[tierInfo.webhook_tier + '_max_api_alerts']) {
      return;
    }
    if (alertChannel.indexOf(2) >= 0 && alertList.length >= tierInfo[tierInfo.sms_tier + '_max_sms_alerts']) {
      return;
    }
    if (alertChannel.indexOf(2) >= 0 &&alertList.length >= tierInfo[tierInfo.call_tier + '_max_call_alerts']) {
      return;
    }*/

    /*let resCheck = await fetch(SERVER_URL + "/alerts/read", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: alertToken[1] })
    })
    resCheck = await resCheck.json()
    resCheck = resCheck.status;*/

    //if alert doesn't exist, then update overwrite or default for notification
    if ((addModalShow === true/* && resCheck === false*/) || (editModalShow === true)) {
      if (overwriteNotify === 1) {
        let upt = {};
        if (notifyEmail !== "")
          upt['email'] = notifyEmail;

        if (notifySMS !== "")
          upt['sms'] = notifySMS;

        if (notifyCall !== "")
          upt['call'] = notifyCall;

        if (notifyWebhook !== "")
          upt['webhook'] = notifyWebhook;


        if (Object.keys(upt).length > 0) {
          await fetch(SERVER_URL + "/alerts/update", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authent': JWT_TOKEN
            },
            body: JSON.stringify({ walletAddr: walletAddr, contactInfo: upt})
          })
        }
      }

      if (defaultNotify === 1) {
        await fetch(SERVER_URL + "/alerts/update", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authent': JWT_TOKEN
          },
          body: JSON.stringify({ walletAddr: walletAddr, default: 0})
        })
      }
    }

    if(maxDays < 15 || maxDays > maxPossibleDays) {
      toastMessage(`Day value should be between from 15 to ${maxPossibleDays}` , 3000)
      setMaxDays(15)
      return;
    }

    if (addModalShow) {
      fetch(SERVER_URL + "/alerts/save", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authent': JWT_TOKEN
        },
        body: JSON.stringify({ walletAddr: walletAddr, tokenName: alertToken[0], tokenSymbol: alertToken[2], tokenAddr: alertToken[1], price: alertPrice, when: alertWhen, channel: alertChannel, time: alertTime, status: 1, contactInfo: {email: notifyEmail, sms: notifySMS, call: notifyCall, webhook: notifyWebhook}, default: defaultNotify, maxDays: maxDays })
      }).then(res => res.json()
      ).then((resp) => {
        if(resp.status === true) {
          let updateArr = [];
          for (let index = 0; index < alertList.length; index++) {
            updateArr.push(alertList[index])
          }
          updateArr.push({ _id: resp.message._id, walletAddr: walletAddr, tokenName: alertToken[0], tokenSymbol: alertToken[2], tokenAddr: alertToken[1], price: alertPrice, when: alertWhen, channel: alertChannel, time: alertTime, status: 1, contactInfo: {email: notifyEmail, sms: notifySMS, call: notifyCall, webhook: notifyWebhook, maxDays: maxDays} })
          setAlertList(updateArr)
          toastMessage("New Alert has been created for selected token.", 1250)
        } else {
          setMessage()
          toastMessage("Some error occurred while creating the alert", 1250)
        }
      })
    } else if (editModalShow) {
      let updateArr = [];
      for (let index = 0; index < alertList.length; index++) {
        updateArr.push(alertList[index])
        if (alertList[index].tokenAddr === alertToken[1] && alertList[index]._id === alertId) { 
          updateArr[index].price = (alertPrice === "") ? 0.001 : alertPrice;
          updateArr[index].when = alertWhen;
          updateArr[index].channel = alertChannel;
          updateArr[index].time = alertTime;
        }
      }
      setAlertList(updateArr)

      await fetch(SERVER_URL + "/alerts/update", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authent': JWT_TOKEN
        },
        body: JSON.stringify({ _id: alertId, walletAddr: walletAddr, tokenName: alertToken[0], tokenSymbol: alertToken[2], tokenAddr: alertToken[1], price: alertPrice, when: alertWhen, channel: alertChannel, time: alertTime, contactInfo: {email: notifyEmail, sms: notifySMS, call: notifyCall, webhook: notifyWebhook}, default: defaultNotify, maxDays: maxDays })
      })
    }
    closeAlert();
  }

  async function editAlert(token) {
    setEdit(true)
    let res = await fetch(SERVER_URL + "/alerts/read", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: token.tokenAddr, _id: token._id })
    })
    res = await res.json()

    if (res.status === false)
      return;

    const alarm = { price: res.message.price, when: res.message.when, channel: res.message.channel, time: res.message.time, status: res.message.status, contactInfo: res.message.contactInfo, default: res.message.default, maxDays: res.message.maxDays};
    token.alarm = alarm;

    setOverwriteNotify(0)
    if (!token.alarm) {
      setAlertToken([token.tokenName, token.tokenAddr, token.tokenSymbol])
      setAlertId('000000')
      setAlertPrice(0);
      setStrPrice('0');
      setAlertWhen(1);
      setAletChannel([]);
      setAlertTime(1);
      setNotifyRecent(0)
      setNotifySmsDelayed(0)
      setNotifyCallDelayed(0)
      setNotifiyEmail('');
      setNotifiyCall('');
      setNotifiySMS('');
      setNotifiyWebhook('');
      setDefaultNotify(0)
      setMaxDays(15)
    } else {
      setAlertToken([token.tokenName, token.tokenAddr, token.tokenSymbol])
      setAlertId(token._id)
      setAlertPrice((token.alarm.price === null) ? 0.001: token.alarm.price);
      setStrPrice((token.alarm.price === null) ? '0.001': token.alarm.price.toString());
      setAlertWhen(token.alarm.when);
      if (token.maxDays) {
        setMaxDays(token.maxDays)
      } else {
        setMaxDays(15)
      }
      let channel = []
      if (emailTier && token.alarm.channel.indexOf(0) >= 0) {
        channel.push(0);
      } 
      if (webhookTier && token.alarm.channel.indexOf(1) >= 0) {
        channel.push(1);
      }
      if (smsTier && token.alarm.channel.indexOf(2) >= 0) {
        channel.push(2);
      }
      if (callTier && token.alarm.channel.indexOf(3) >= 0) {
        channel.push(3);
      }
      setAletChannel(channel);
      if (res.lastTrigged !== undefined && res.lastTrigged > 0 && res.failedCallTimes && res.failedSmsTimes && res.failedCallTimes) {
        setAlertTime(token.alarm.time);
        setNotifyRecent(res.lastTrigged);
        setNotifySmsDelayed(res.failedSmsTimes)
        setNotifyCallDelayed(res.failedCallTimes)
      } else {
        setAlertTime(token.alarm.time);
        setNotifyRecent(0);
        setNotifySmsDelayed(0)
        setNotifyCallDelayed(0)
      }

      setNotifiyEmail(token.alarm.contactInfo.email ? token.alarm.contactInfo.email : "");
      setNotifiySMS(token.alarm.contactInfo.sms ? token.alarm.contactInfo.sms : "");
      setNotifiyCall(token.alarm.contactInfo.call ? token.alarm.contactInfo.call : "");
      setNotifiyWebhook(token.alarm.contactInfo.webhook ? token.alarm.contactInfo.webhook : "");
      setDefaultNotify(token.alarm.default)
    }
    if (addModalShow === true)
      setAddModalShow(false)

    setEditModalShow(true)
  }

  async function addAlert(token) {
    setAlertToken([token.tokenName, token.contractAddress, token.tokenSymbol])
    setAlertId(token._id)
    setAlertPrice(token.tokenPriceUSD);
    setStrPrice(token.tokenPriceUSD.toFixed(17).replace(/\.?0+$/, ""))
    setAlertWhen(1);
    setAlertTime(1);
    setDefaultNotify(0);
    setOverwriteNotify(0);
    let res = await fetch(SERVER_URL + "/alerts/read", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr, default: 1 })
    })
    res = await res.json();
    if (res.status ===  true) {
      let channel = []
      if (emailTier && res.message.channel.indexOf(0) >= 0) {
        channel.push(0);
      } 
      if (webhookTier && res.message.channel.indexOf(1) >= 0) {
        channel.push(1);
      }
      if (smsTier && res.message.channel.indexOf(2) >= 0) {
        channel.push(2);
      }
      if (callTier && res.message.channel.indexOf(3) >= 0) {
        channel.push(3);
      }
      setAletChannel(channel);
      setNotifiyEmail(res.message.contactInfo.email);
      setNotifiyCall(res.message.contactInfo.call);
      setNotifiySMS(res.message.contactInfo.sms);
      setNotifiyWebhook(res.message.contactInfo.webhook);
    } else {
      setNotifiyEmail('');
      setNotifiyCall('');
      setNotifiySMS('');
      setNotifiyWebhook('');
      setAletChannel([]);
    }

    if (editModalShow === true)
      setEditModalShow(false);

    setAddModalShow(true)
  }

  function confirmDelete(token) {
    setDelToken(token);
    setDelModalShow(true);
  }

  function accepDelete() {
    setDelModalShow(false);
    removeAlert(delToken)
  }

  function declineDelete() {
    setDelToken({});
    setDelModalShow(false);
  }

  async function removeAlert(token) {
    await fetch(SERVER_URL + "/alerts/remove", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: token.tokenAddr, _id: token._id })
    })

    let updateArr = [];
    for (let index = 0; index < alertList.length; index++) {
      if (alertList[index]._id !== token._id) {
        updateArr.push(alertList[index])
      }
    }
    setAlertList(updateArr)
  }

  function changeAlertStatus(token) {
    let contracAddr = token.tokenAddr
    let updateArr = [];
    for (let index = 0; index < alertList.length; index++) {
      updateArr.push(alertList[index])
      if (alertList[index].tokenAddr === contracAddr && alertList[index]._id === token._id ) {
        if (updateArr[index].status > 0)
          updateArr[index].status = -1;
        else
          updateArr[index].status = 1;

        fetch(SERVER_URL + "/alerts/update", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authent': JWT_TOKEN
          },
          body: JSON.stringify({ walletAddr: walletAddr, tokenAddr: contracAddr, status: updateArr[index].status, _id: token._id})
        })
      }
    }
    setAlertList(updateArr)
  }

  function onChannelSetting() {
    if (addModalShow) {
      setAddModalShow(false);
      setChannelModalShow(1);
    } else if (editModalShow) {
      setEditModalShow(false);
      setChannelModalShow(2);
    }

    setNotifiyEmailPrev(notifyEmail);
    setNotifiyCallPrev(notifyCallPrev);
    setNotifiySMSPrev(notifySMS);
    setNotifiyWebhookPrev(notifyWebhook);
    
  }

  function saveChannelSetting() {

    if (notifySMS !== "") {
      if (isPossiblePhoneNumber(notifySMS) === false) {
        toastMessage('invalid phone number for sms', 900)
        return;
      }
    }

    if (notifyCall !== "") {
      if (isPossiblePhoneNumber(notifyCall) === false) {
        toastMessage('invalid phone number for call', 900)
        return;
      }
    }

    if (notifyEmail !== "") {
      if (validator.isEmail(notifyEmail) === false) {
        toastMessage('invalid email address', 900)
        return;
      }
    }

    if (notifyWebhook !== "") {
      if (validator.isURL(notifyWebhook, { protocols: ['http','https'] }) === false) {
        toastMessage('invalid webhook ur', 900)
        return;
      }
    }

    //if any chnnel became empty from some content, please check if it is enabled and disable it
    let modified = [];
    for (let i = 0; i < alertChannel.length; i++) {
      if (alertChannel[i] === 0 && notifyEmail) {
        modified.push(0)
      } else if (alertChannel[i] === 1 && notifyWebhook) {
        modified.push(1)
      } else if (alertChannel[i] === 2 && notifySMS) {
        modified.push(2)
      } else if (alertChannel[i] === 3 && notifyCall) {
        modified.push(3)
      }
    }

    setAletChannel(modified);
    
    if (channelModalShow === 1) {
      setAddModalShow(true);
    } else {
      setEditModalShow(true);
    }
    setChannelModalShow(0);
  }

  function closeChannelSetting() {
    if (channelModalShow === 1) {
      setAddModalShow(true);
    } else {
      setEditModalShow(true);
    }

    setNotifiyEmail(notifyEmailPrev);
    setNotifiyCall(notifyCallPrev);
    setNotifiySMS(notifySMSPrev);
    setNotifiyWebhook(notifyWebhookPrev);
    setChannelModalShow(0);
  }

  function setChannel(val) {
    //check the tier membership
    let alert = "{FUNCTION} is a {TIER_NAME} feature. You need to hold {MIN_TIER_TOKEN} Safe tokens and {MIN_LP_TOKEN} Safemoon LP<br/><a href='{BUY_LINK}' target='_blank'>Upgade to {TIER_NAME} Tier</a>";
    if (val === 0 && !emailTier && alertChannel.indexOf(val) < 0) {
      alert = alert.replace('{FUNCTION}', 'Email alert')
      alert = alert.replaceAll('{TIER_NAME}', tierInfo[tierInfo.email_tier + '_name']);
      alert = alert.replace('{MIN_TIER_TOKEN}', tierInfo[tierInfo.email_tier + '_min_tokens']);
      alert = alert.replace('{MIN_LP_TOKEN}', tierInfo[tierInfo.email_tier + '_min_lp']);
      alert = alert.replace('{BUY_LINK}', 'https://pancakeswap.finance/swap?outputCurrency=' + tierInfo.tier_token_address);
      messageBox(alert)
      return;
    }
    if (val === 1 && !webhookTier && alertChannel.indexOf(val) < 0) {
      alert = alert.replace('{FUNCTION}', 'Webhook alert')
      alert = alert.replaceAll('{TIER_NAME}', tierInfo[tierInfo.webhook_tier + '_name']);
      alert = alert.replace('{MIN_TIER_TOKEN}', tierInfo[tierInfo.webhook_tier + '_min_tokens']);
      alert = alert.replace('{MIN_LP_TOKEN}', tierInfo[tierInfo.webhook_tier + '_min_lp']);
      alert = alert.replace('{BUY_LINK}', 'https://pancakeswap.finance/swap?outputCurrency=' + tierInfo.tier_token_address);
      messageBox(alert)
      return;
    }
    if (val === 2 && !smsTier && alertChannel.indexOf(val) < 0) {
      alert = alert.replace('{FUNCTION}', 'SMS alert')
      alert = alert.replaceAll('{TIER_NAME}', tierInfo[tierInfo.sms_tier + '_name']);
      alert = alert.replace('{MIN_TIER_TOKEN}', tierInfo[tierInfo.sms_tier + '_min_tokens']);
      alert = alert.replace('{MIN_LP_TOKEN}', tierInfo[tierInfo.sms_tier + '_min_lp']);
      alert = alert.replace('{BUY_LINK}', 'https://pancakeswap.finance/swap?outputCurrency=' + tierInfo.tier_token_address);
      messageBox(alert)
      return;
    }
    if (val === 3 && !callTier && alertChannel.indexOf(val) < 0) {
      alert = alert.replace('{FUNCTION}', 'Call alert')
      alert = alert.replaceAll('{TIER_NAME}', tierInfo[tierInfo.call_tier + '_name']);
      alert = alert.replace('{MIN_TIER_TOKEN}', tierInfo[tierInfo.call_tier + '_min_tokens']);
      alert = alert.replace('{MIN_LP_TOKEN}', tierInfo[tierInfo.call_tier + '_min_lp']);
      alert = alert.replace('{BUY_LINK}', 'https://pancakeswap.finance/swap?outputCurrency=' + tierInfo.tier_token_address);
      messageBox(alert)
      return;
    }

    //check if exceeds feature's max_alert
    let emailNum, smsNum, callNum, apiNum = 0
    for (let i = 0; i < alertList.alertList; i++) {
      if (alertList[i].contactInfo.email !== "") {
        emailNum ++;
      } else if (alertList[i].contactInfo.sms !== "") {
        smsNum ++;
      } else if (alertList[i].contactInfo.call !== "") {
        callNum ++;
      } else if (alertList[i].contactInfo.webhook !== "") {
        apiNum ++;
      }
    }

    if (val === 0 && tierInfo[tierInfo.email_tier + '_max_email_alerts'] && emailNum >= tierInfo[tierInfo.email_tier + '_max_email_alerts']) {
      messageBox('Exceed max number of email alerts')
      return;
    } else if (val === 1 && tierInfo[tierInfo.webhook_tier + '_max_api_alerts'] && apiNum >= tierInfo[tierInfo.webhook_tier + '_max_api_alerts']) {
      messageBox('Exceed max number of webhook alerts')
      return;
    } else if (val === 2 && tierInfo[tierInfo.sms_tier + '_max_sms_alerts'] && smsNum >= tierInfo[tierInfo.sms_tier + '_max_sms_alerts']) {
      messageBox('Exceed max number of sms alerts')
      return;
    } else if (val === 3 && tierInfo[tierInfo.call_tier + '_max_call_alerts'] && callNum >= tierInfo[tierInfo.call_tier + '_max_call_alerts']) {
      messageBox('Exceed max number of call alerts')
      return;
    }

    let channelArr = [];
    if ((val === 0 && !notifyEmail) || (val === 1 && !notifyWebhook) || (val === 2 && !notifySMS) || (val === 3 && !notifyCall)) {
      onChannelSetting();
      return;
    }

    for (let index = 0; index < 4; index++) {
      if (index === val) {
        if (alertChannel.indexOf(val) < 0) {
          channelArr.push(index)
        }
      } else if (alertChannel.indexOf(index) >= 0) {
        channelArr.push(index)
      }
    }

    setAletChannel(channelArr);
  }

  async function addNewAlert(e) {
      let alert = "You have used up the max allowed number of active alerts.<br/><a href='{BUY_LINK}' target='_blank'>Upgrade to {TIER_NAME} to be able to create more</a>";
      if (alertList.length >= tierInfo[ownTopTier + '_max_alerts_total']) {
        let tier = ''
        for (let i = 0; i < 3; i++) {
          if (i === 0 ) {
            tier = tierInfo.email_tier;
          } else if (i === 1) {
            tier = tierInfo.webhook_tier
          } else if (i === 2) {
            tier = tierInfo.sms_tier;
          } else if (i === 3) {
            tier = tierInfo.call_tier;
          }
          
          if (tierInfo[ownTopTier + '_max_alerts_total'] < tierInfo[tier + '_max_alerts_total']) {
            break;
          } else {
            tier = ''
          }
        }
        if (tier !== '') {
          alert = alert.replace('{TIER_NAME}', tierInfo[tier + '_name'])
          alert = alert.replace('{BUY_LINK}', 'https://pancakeswap.finance/swap?outputCurrency=' + tierInfo.tier_token_address);
        } else {
          alert = "Not able to add new alert anymore. Reached TOTAL_ALERT_LIMIT. It will be upgraded soon"
        }
        messageBox(alert)
        return;
      }


      let tokenPrice = 0;
      let currDate = new Date();
      if(e.tokenPriceUSD !== undefined && e.fetchedTime && (currDate.getTime() - e.fetchedTime < 60000)) {
        tokenPrice =e.tokenPriceUSD;
      } else {
        //tokenPrice = 0.001;
        setLoadingModalShow(true);
        const data = {
          WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', //wbnb
          BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
          factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
          router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
        }
        //const NETWORK_URL = "https://twilight-autumn-sky.bsc.quiknode.pro/1085e5a615dcd07068888c33d076d0f7842e01e7/";
        const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
        const factory = new ethers.Contract(
          data.factory,
          [
            'function getPair(address tokenA, address tokenB) external view returns (address pair)'
          ],
          provider
        );

        const router = new ethers.Contract(
          data.router,
          [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
          ],
          provider
        );

        const token = new ethers.Contract(
          e.contractAddress,
          [
            'function decimals() external view returns (uint8)',
            'function symbol() external view returns (string memory)'
          ],
          provider
        );

        if (e.tokenSymbol === undefined) {
          e.tokenSymbol = await token.symbol();
        }

        let wBnbAmounts;
        try {
          wBnbAmounts = await router.getAmountsOut('1000000000000000000', [data.WBNB, data.BUSD]);
        } catch (error) {
          wBnbAmounts = [0,0];
        }

        const wBnbPrice = wBnbAmounts[1] * 1e-18;

        let pairAddress;
        try {
          pairAddress = await factory.getPair(data.WBNB, e.contractAddress);
        } catch (error) {
          pairAddress = null;
        }

        if (e.contractAddress.toLowerCase() === "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c") {
            e.tokenPriceUSD = wBnbPrice;
            let fetchedTime = new Date();
            e.fetchedTime = fetchedTime.getTime();
        } else if (pairAddress !== null && pairAddress !== undefined) {
          if (pairAddress.toString().indexOf('0x0000000000000') > -1) {
            e.tokenPriceBNB = 0;
            e.tokenPriceUSD = 0;
            let fetchedTime = new Date();
            e.fetchedTime = fetchedTime.getTime();
          } else {
            let decimal;
            try {
              decimal = await token.decimals();
            } catch (error) {
              decimal = 1;
            }
            let input = "1";
            for (let i = 0; i < decimal; i++) {
              input += "0"
            }
            let tokenAmounts;
            try {
              tokenAmounts = await router.getAmountsOut(input, [e.contractAddress, data.WBNB]);
            } catch (error) {
              tokenAmounts = [0,0];
            }
            const tokenPricePerBnb = tokenAmounts[1] * 1e-18;
            tokenPrice= tokenPricePerBnb * wBnbPrice;
            e.tokenPriceBNB = tokenPricePerBnb;
            e.tokenPriceUSD = tokenPrice;
            let fetchedTime = new Date();
            e.fetchedTime = fetchedTime.getTime();
          }
        }
        setLoadingModalShow(false);
      }
      addAlert(e);
    
  }

  function toastMessage(msg, timeout) {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false)
    }, timeout);
  }

  function messageBox(msg) {
    setMessage(msg)
    setMsgModalshow(true);
  }

  function confirmMessageBox() {
    setMsgModalshow(false);
  }

  function validInput(e) {
    if ((e.target.value.indexOf('.') >= 0 && (e.target.value.length -  e.target.value.indexOf('.') - 1) > 17) ||  (e.target.value.indexOf('.') < 0 && e.target.value.length > 17)) {
        return;
    }

    if (e.target.validity.valid) {
      setAlertPrice((e.target.value === "") ? 0 : Number(e.target.value));
      setStrPrice(e.target.value);
    }
  }

  function inputMaxDays(e) {
    let input = e.target.value;
    setMaxDays(Number(input))
  }

  tokenTransList.map((value, index) => {
    hiddenArr.push(false)
  })
  const handleChange = (e, tokenAddr) => {
    let scamList = window.localStorage.getItem("scamList");
    if (scamList) {
      let scamObj = JSON.parse(scamList);
      if (scamObj[tokenAddr]) {
        scamObj[tokenAddr] = false;
      } else {
        scamObj[tokenAddr] = true;
      }
      window.localStorage.setItem("scamList", JSON.stringify(scamObj))
      setScamTokens(scamObj)      
    } else {
      let newObj = {}
      newObj[tokenAddr] = true;
      window.localStorage.setItem("scamList", JSON.stringify(newObj))
      setScamTokens(newObj)
    }
  }

  const setHide = () => {
    setHidden(!hidden)
  }
  return (
    <div className="colored_table_data">
      <div className="top_not_sec chart_part">
        <ul className="nav nav-pills mb-3 justify_mobile" id="pills-tab" role="tablist">
          <li className="nav-item" role="presentation" onClick={toggleAlert}>
            <a className={tableToggle ? "nav-link active" : "nav-link"} id="pills-home-tab" data-toggle="pill" href="#wallet" role="tab" aria-controls="pills-home" aria-selected="true"><span className="icon-iconly_bell_gray b_font"><span className="path1" /><span className="path2" /></span> ALERTS</a>
          </li>
          <li className="nav-item" role="presentation" onClick={toggleWallet}>
            <a className={tableToggle ? "nav-link wallet" : "nav-link wallet active"} id="pills-wallet-tab" data-toggle="pill" href="#wallet" role="tab" aria-controls="pills-profile" aria-selected="false"><span className="icon-iconly_wallet b_font"><span className="path1" /><span className="path2" /><span className="path3" /></span> MY WALLET</a>
          </li>
        </ul>
        
        {(walletAddr !== "Connect") && 
          <div style={{height: '50px', display: 'flex'}}>
            <div style={{marginRight: '10px'}}><h2 style={{paddingTop: '15px'}}>${`${lastprice.toFixed(2)}`}</h2></div>
            <LineChart graphVal={priceList}/>
          </div>
        }
      </div>
      <div className="tab-content" id="pills-tabContent">
        <div className={tableToggle ? "tab-pane fade show active" : "tab-pane fade"} id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
          <table className="table table-bordered table-hover mytable dataTable no-footer dtr-inline">
            <thead>
              <tr>
                <th className={nameSort + " test"} onClick={sortByName}>Name</th>
                <th className={priceSort + " test"} onClick={sortByPrice}>Price</th>
                <th className={actionSort + " test"} onClick={sortByAction}>Action</th>
              </tr>
            </thead>
            <tbody className="table-wrap">
              {alertList.map((e, index) => {
                return <tr id={index} key={index}>
                  <td  onClick={() => editAlert(e)}>{e.tokenName}</td>
                  <td  onClick={() => editAlert(e)} style={{color: (usdValList[usdValList.length-1-index] === undefined) ? 'white' : (usdValList[usdValList.length-1-index] < e.price ? 'red' : '#1BC870')}}>${e.price}</td>
                  <td className="icon_set">
                    <a href="#wallet" onClick={() => confirmDelete(e)}><img src="img/iconly_delete.svg" alt="" /></a>
                    <a href="#wallet" onClick={() => editAlert(e)}><img src="img/iconly_bulk.svg" alt="" /></a>
                    <a href="#wallet" onClick={() => changeAlertStatus(e)}><span className={(e.status < 0) ? "icon-iconly_bell_gray class1" : "icon-iconly_bell_gray class2"} id="div"><span className="path1" /><span className="path2" /></span></a>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <div className={tableToggle ? "tab-pane fade" : "tab-pane fade active show"} id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
          {/*<h3 className="text-center">{walletAddr}</h3>*/}
          <table className="table table-bordered table-hover mytable dataTable no-footer dtr-inline">
            <thead>
              <tr>
                <th className="hide-header" style={{color: 'orange'}}>{hidden ? <VisibilityOutlinedIcon onClick={()=> setHide()} className="icon header-icon" /> : <VisibilityOffOutlinedIcon onClick={()=> setHide()} className="icon header-icon" />}</th>
                <th className={nameSortInWallet + " header"} onClick={sortByNameInWallet}>Token Name</th>
                {/*<th className={symbolSortInWallet} onClick={sortBySymbolInWallet}>Symbol</th>
                <th  className={bnbPriceSortInWallet} onClick={sortByBnbPriceInWallet}>Token Price(BNB)</th>*/}
                <th className={priceSortInWallet + " header"} onClick={sortByPriceInWallet}>Price</th>
                <th className={balanceSortInWallet + " header balance"} onClick={sortByBalanceInWallet}>Balance</th>
                <th className={totalSortInWallet + " header"} onClick={sortByTotalInWallet}>Total</th>
                {walletAddr !== 'Connect' && <th className="wrap-check"></th>}
              </tr>
            </thead>
            {
              <tbody className="table-wrap">
                {tokenTransList.map((e, index) => 
                  {
                    scamTokenList.push(e.contractAddress)
                    return (
                    (!scamTokens[e.contractAddress] || (!hidden && scamTokens[e.contractAddress])) &&<tr id={index} key={index}>
                    <td className="hide-icon hide-header">
                      {!scamTokens[e.contractAddress] ? 
                        <VisibilityOutlinedIcon onClick={(event) => handleChange(event, e.contractAddress)} className="icon"/> : <VisibilityOffOutlinedIcon onClick={(event) => handleChange(event, e.contractAddress)} className="icon" />
                      }
                    </td>
                    <td onClick={(event) => addNewAlert(e)}>{e.tokenName} ({e.tokenSymbol})</td>
  {/*                  <td>{e.tokenSymbol}</td>
                    <td>{e.tokenPriceBNB === undefined ? '0' : e.tokenPriceBNB.toFixed(13)}</td>*/}
                    <td onClick={(event) => addNewAlert(e)}>{e.tokenPriceUSD === undefined ? '0' : '$'+ e.tokenPriceUSD.toFixed(17).replace(/\.?0+$/, "")}</td>
                    <td onClick={(event) => addNewAlert(e)}>{e.balance === undefined ? '0' : e.balance.toFixed(8).replace(/\.?0+$/, "")}</td>
                    <td onClick={(event) => addNewAlert(e)}>{(e.tokenPriceBNB === undefined || e.tokenPriceUSD === undefined) ? '0' : '$'+(e.tokenPriceUSD * e.balance).toFixed(8).replace(/\.?0+$/, "")}</td>
                    <td className="wrap-td">
                      <a href={`https://bscscan.com/address/${e.contractAddress}`} target="_blank"><img src="img/bscscansvg.svg" alt="" className="bsc-svg" /></a>
                      <a href={`https://poocoin.app/tokens/${e.contractAddress}`} target="_blank"><img src="img/poocoinsvg.svg" alt="" className="poocoin-svg" /></a>
                    </td>
                  </tr>
                  )}
                )}
              </tbody>
            }
          </table>
        </div>
      </div>
      {showMessage && <div className="col-lg-10 top-alert" style={{zIndex: "2000"}}>
        <div className="alert alert-success alert-dismissible">
          <strong>Alert:</strong> {ReactHtmlParser(message)}
        </div>
      </div>}
      {loadingModalShow && <div className="modal fade show" aria-hidden="true" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
            <span className="fa fa-spinner fa-spin fa-3x loading-bar"></span>
        </div>
      </div>}
      {loadingModalShow && <div className="modal-backdrop fade show"></div>}
      {(!msgModalShow && (editModalShow || addModalShow)) && <div className="modal fade data_popup show" id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body">
              <h4 className="moon_next">{alertToken[0]}</h4>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <small style={{color: "#eeaf4b", paddingTop: '3px'}}>Contract: <a style={{textDecoration: 'unset', color: '#eeaf4b'}} target="_blank" href={`https://poocoin.app/tokens/${alertToken[1]}`}>{alertToken[1].substring(0, 7) + "..." + alertToken[1].slice(-4)}</a>&nbsp;&nbsp;<i  style={{color: "#eeaf4b"}} className={copiedHidden ? "far fa-copy" : "far fa-check-circle"} onClick={() => onCopy(850)}></i></small><br/>
              {(editModalShow && notifyRecent > 0 && notifySmsDelayed < 3 && notifyCallDelayed < 3) && <small>Last triggered: {millisecToDate(notifyRecent)}</small>}
              {(editModalShow && (notifySmsDelayed >= 3 || notifyCallDelayed >= 3)) && <small style={{color: "orange"}}>⚠️Delayed</small>}
              </div>
              <div className="next_moon">
                <form>
                  <div className="row align-items-center mb-3">
                    <div className="col-lg-3">
                      <div className="price_form">
                        <h6>Price</h6>
                      </div>
                    </div>
                    <div className="col-lg-9">
                    <div className="file_priced">
                      <span className="d-flex align-items-center justify-content-between">
                        <span>
                          <small id="emailHelp" className="form-text notify_me">Notify me when price is </small>
                        </span>
                        <span className="toggle_check_b">
                          <input type="checkbox" id="sdf" checked={(alertWhen < 0) ? false : true} onChange={() => setAlertWhen((alertWhen < 0) ? 1 : -1)}></input>
                          <label htmlFor="sdf" data-off="Under" data-on="Over">
                          <span></span>
                          </label>
                        </span>
                      </span>
                      <input className="form-control" inputMode="decimal" autoComplete="off" autoCorrect="off" value={strPrice} type="text" pattern="^[0-9]*[.,]?[0-9]*$" placeholder="0.001" spellCheck="false" onChange={(e) => validInput(e)} style={{color: "white"}}></input>
                      </div>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-lg-3 channel-setting-wrap">
                      <div className="channel_box">
                        <h6>Channel&nbsp;&nbsp;<i className="fa fa-gear channel-setting-btn" onClick={onChannelSetting}></i></h6>
                      </div>
                    </div>
                    <div className="col-lg-9 d-flex">
                      <div className="cheak_box">
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox1" type="checkbox" checked={(alertChannel.indexOf(0) >= 0) ? true : false} onChange={() => setChannel(0)}/>
                          <label htmlFor="checkbox1">Email</label>
                        </div>
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox2" type="checkbox" checked={(alertChannel.indexOf(1) >= 0) ? true : false} onChange={() => setChannel(1)}/>
                          <label htmlFor="checkbox2">API</label>
                        </div>
                      </div>
                      <div className="cheak_box">
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox3" type="checkbox" checked={(alertChannel.indexOf(2) >= 0) ? true : false} onChange={() => setChannel(2)}/>
                          <label htmlFor="checkbox3">SMS</label>
                        </div>
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox4" type="checkbox" checked={(alertChannel.indexOf(3) >= 0) ? true : false} onChange={() => setChannel(3)}/>
                          <label htmlFor="checkbox4">Phone call</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-3">
                      <div className="channel_box">
                        <h6>When</h6>
                      </div>
                    </div>
                    <div className="col-lg-9 d-flex">
                      <div className="cheak_box">
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox6" type="checkbox" checked={(alertTime === 1) ? true : false} onChange={() => setAlertTime(1)}/>
                          <label htmlFor="checkbox6">Once</label>
                        </div>
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox5" type="checkbox" checked={(alertTime === 0) ? true : false} onChange={() => setAlertTime(0)}/>
                          <label htmlFor="checkbox5">Every time</label>
                        </div>
                      </div>
                      <div className="cheak_box">
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox7" type="checkbox" checked={(alertTime === 2) ? true : false} onChange={() => setAlertTime(2)}/>
                          <label htmlFor="checkbox7">Once per day</label>
                        </div>
                        
                        {(alertTime === 2 || alertTime === 0 ) && (
                          <div>
                            <input style={{backgroundColor: 'rgb(23 23 23 / 59%)', borderRadius: '5px',height: '25px', border: 'none', padding: '0.375rem 0.35rem', color: '#fff', marginRight: '10px'}} type="number" name="text" value={maxDays} onChange={(e) => inputMaxDays(e)} min={15} max={maxPossibleDays}/><label>days</label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="btn_save_close">
              <button type="button" className="btn btn-primary save_btn popup1_open" onClick={saveAlert}>Save</button>
              <button type="button" className="btn btn-secondary close_btn" data-dismiss="modal" onClick={closeAlert}>Close</button>
            </div>
          </div>
        </div>
      </div>}
      {msgModalShow && <div className="modal fade data_popup show" id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body" style={{wordWrap: "break-word"}}>
              <h4 className="moon_next">Feature Requirement</h4>
              <h6>{ReactHtmlParser(message)}</h6>
            </div>
            <div className="btn_channel_save_close">
              <button type="button" className="btn btn-primary channel_save_btn popup1_open" onClick={confirmMessageBox}>Confirm</button>
            </div>
          </div>
        </div>
      </div>}
      {(channelModalShow > 0) && <div className="modal fade data_popup show" id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body">
            <h4 className="moon_next">Notification Channel Settings</h4>
              <div className="next_moon">
                <form>
                  <div className="row align-items-center mb-3">
                    <div className="col-lg-3">
                      <div className="price_form">
                        <h6>Email</h6>
                      </div>
                    </div>
                    <div className="col-lg-9">
                    <div className="file_priced">
                      <input className="form-control" aria-describedby="emailHelp" placeholder="example@email.com"  value={notifyEmail} onChange={(e) => setNotifiyEmail(e.target.value)} style={{color: "white"}}/>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center mb-3">
                    <div className="col-lg-3">
                      <div className="price_form">
                        <h6>SMS</h6>
                      </div>
                    </div>
                    <div className="col-lg-9">
                    <div className="file_priced">
                      <input className="form-control" aria-describedby="emailHelp" placeholder="+15017122661"  value={notifySMS} onChange={(e) => setNotifiySMS(e.target.value)} style={{color: "white"}}/>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center mb-3">
                    <div className="col-lg-3">
                      <div className="price_form">
                        <h6>Call</h6>
                      </div>
                    </div>
                    <div className="col-lg-9">
                    <div className="file_priced">
                      <input className="form-control" aria-describedby="emailHelp" placeholder="+15017122661"  value={notifyCall} onChange={(e) => setNotifiyCall(e.target.value)} style={{color: "white"}}/>
                      </div>
                    </div>
                  </div>
                  <div className="row align-items-center mb-3">
                    <div className="col-lg-3">
                      <div className="price_form">
                        <h6>Webhook</h6>
                      </div>
                    </div>
                    <div className="col-lg-9">
                    <div className="file_priced">
                      <input className="form-control" id="" aria-describedby="emailHelp" placeholder="https://hooks.slack.com/services/XXX" value={notifyWebhook} onChange={(e) => setNotifiyWebhook(e.target.value)} style={{color: "white"}}/>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="btn_channel_save_close">
              <button type="button" className="btn btn-primary channel_save_btn popup1_open" onClick={saveChannelSetting}>Save</button>
              <button type="button" className="btn btn-secondary channel_close_btn" data-dismiss="modal" onClick={closeChannelSetting}>Close</button>
            </div>
          </div>
        </div>
      </div>}
      {delModalShow && <div className="modal fade data_popup show" id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-body">
            <h4 className="moon_next">Delete this alert?</h4>
              <div className="next_moon">
              </div>
            </div>
            <div className="btn_channel_save_close">
              <button type="button" className="btn btn-primary channel_save_btn popup1_open" onClick={accepDelete}>Yes</button>
              <button type="button" className="btn btn-secondary channel_close_btn" data-dismiss="modal" onClick={declineDelete}>No</button>
            </div>
          </div>
        </div>
      </div>}
      {(editModalShow || addModalShow || delModalShow || msgModalShow || channelModalShow > 0) && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default connect(mapStateToProps)(DetailTable);

