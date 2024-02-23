import React, { useState, useEffect, useRef } from "react";
import { connect } from "react-redux";
import { useDispatch } from "react-redux";
import { ethers } from 'ethers'
//import {reactLocalStorage} from 'reactjs-localstorage';
import config from '../config.js'

const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;

let token = '';
let WALLET_ADDR = "";

function mapStateToProps(state) {
    WALLET_ADDR = state.walletAddr;
    return { walletAddr: state.walletAddr };
};

function Searchwidget({ walletAddr }) {
    const dispatch = useDispatch();
    const [tokenInfo, setTokenInfo] = useState('')
    const [tokenResult, setTokenResult] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    let itemRefs = [];

    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef);
    function useOutsideAlerter(ref) {
        useEffect(() => {
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    hideSearchResult();
                    setTokenInfo('');
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [ref]);
    }

    async function searchToken(searchName) {
        setTokenResult([]);
        setTokenInfo(searchName)

        if (searchName === "") {
            return;
        }
    }

    async function fetchSearchResult(searchName) {
        /*if (walletAddr === "Connect")
            return;*/

        //should be able to search even if not connectd
        let res = await fetch(SERVER_URL + "/search", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //'authent': reactLocalStorage.get('apiKey')
            },
            body: JSON.stringify({walletAddr: WALLET_ADDR, name: searchName})
        })
        res = await res.json()

        if (res.result && res.result.length > 0) {
            for (let index = 0; index < res.result.length; index++) {
                const element = res.result[index];
                if (element.name === "") {
                    const NETWORK_URL = "https://bsc-dataseed1.binance.org/"
                    const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
                    const token = new ethers.Contract(
                        element.addr,
                        [
                            'function name() view returns (string)'
                        ],
                        provider
                    );

                    try {
                        let tokenName = await token.name();
                        res.result[index].name = tokenName;
                    } catch(err) {
                        res.result[index].name = "unknown";
                    }
                }
            }
            setTokenResult(res.result)
        } else {
            setTokenResult([]);
        }
    }

    function hideSearchResult() {
        setTokenResult([])
    }

    function selectToken(token) {
        setTokenInfo("");
        dispatch({type: 'tokenSearched', payload: token});
        hideSearchResult();
        setSelectedIndex(-1)
    }

    function keyHandler(e) {
        if (e.key === "Enter") {
            if (selectedIndex < 0) {
                selectToken(tokenResult[0])
            } else {
                selectToken(tokenResult[selectedIndex])
            }
        } else if (e.key === "ArrowUp") {
            if (selectedIndex - 1 >= 0) {
                itemRefs[selectedIndex - 1].scrollIntoView({ behavior: "smooth", block: "end" });
                setSelectedIndex(selectedIndex - 1);
            }
        } else if (e.key === "ArrowDown") {
            if (selectedIndex + 1 < tokenResult.length) {
                itemRefs[selectedIndex + 1].scrollIntoView({ behavior: "smooth", block: "end" });
                setSelectedIndex(selectedIndex + 1);
            }
        }
    }

    useEffect(() => {
        if (tokenInfo !== "") {
            token = tokenInfo;
            setTimeout(() => {
                if (token === tokenInfo) {
                    fetchSearchResult(tokenInfo)
                }
            }, 400);
        }
    }, [tokenInfo])

    useEffect(() => {
        if (tokenResult.length > 0) {
            if (itemRefs.length > 0) {
                itemRefs[0].scrollIntoView({ block: "end" });
            }
        }
    }, [tokenResult])

    function handlePaste() {
      navigator.clipboard.readText().then((data) => searchToken(data))
    }

    return (
        <div className="row">
            <div className="col-12" ref={wrapperRef}>
                <div className={(tokenResult.length > 0) ? "input-group search_auto mb-2" : "input-group search_auto mb-2"}>
                    <div className="input-group-append first_s">
                        {(tokenInfo === "" || tokenResult.length > 0) && <i className="fa fa-search search-icon"></i>}
                        {(tokenInfo.length > 1 && tokenResult.length <= 0) && <i className="fa fa-spinner fa-spin fa-2x searching-icon"></i>}
                    </div>
                    <input className="form-control border-secondary py-2" type="search" placeholder="Search by Token" value={tokenInfo} onChange={(e) => searchToken(e.target.value)} onKeyUp={(e) => keyHandler(e)} style={{color: "white"}}/>
                    <div className="input-group-append">
                        <button className="btn btn-outline-secondary plus_icon" type="button" onClick={() => handlePaste()} >
                            <i className="fas fa-paste" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div className="input-popup-wrap">
                    <div className="input-popup-menu" style={{display: (tokenResult.length > 0) ? "block" : "none"}}>
                        {tokenResult.map((e, index) => {
                            return <div key={index} className={(selectedIndex === index) ? "search-result-item search-result-item-selected": "search-result-item"} onClick={() => selectToken(e)} ref={el => (itemRefs[index] = el)}>
                                <div style={{fontSize: "20px"}}>{e.name}</div>
                                <div>{e.addr}</div>
                            </div>
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default connect(mapStateToProps)(Searchwidget);
