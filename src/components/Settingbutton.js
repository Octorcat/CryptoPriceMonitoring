import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { connect } from "react-redux";
import { reactLocalStorage } from 'reactjs-localstorage';
import config from '../config.js'
import Profile from './Profile'
import Tire from './Tire'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;
let JWT_TOKEN = reactLocalStorage.get('apiKey')
let WALLET_ADDR = "";
function mapStateToProps(state) {
  WALLET_ADDR = state.walletAddr;
  return { walletAddr: state.walletAddr, tokenInfo: state.tokenInfo };
};

function Settingbutton({walletAddr}) {
    const dispatch = useDispatch();
    const [mainModalShow, setmainModalShow] = useState(false);
    const [tableToggle, setTableToggle] = useState(1)
    const [account, setAccount] = useState('')
    const toggleProfile = () => { setTableToggle(1) }
    const toggleTier    = () => { setTableToggle(0) }


    async function showModal() {
      if(!mainModalShow) {
        setmainModalShow(true);
      }
    }
    function closeModal() {
      setmainModalShow(false);
    }

    return (
        <>
        <div style={{marginRight:'20px'}} className="wide">
            <button className="btn btn-outline-success connect popup1_open setting" type="submit" onClick={showModal}>
              <SettingsOutlinedIcon />
            </button>
        </div>
        {mainModalShow && <div className="modal fade data_popup show" id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-body">
                    <div className="colored_table_data">
                        <div className="top_not_sec modal_top">
                            <ul className="nav nav-pills mb-3 justify_mobile" id="pills-tab" role="tablist">
                            <li className="nav-item" style={{width: '132px'}} role="presentation" onClick={toggleProfile}>
                                <a className={tableToggle ? "nav-link active" : "nav-link"} id="pills-profile-tab" data-toggle="pill" href="#wallet" role="tab" aria-controls="pills-profile" aria-selected="true"><span className="icon-iconly_bell_gray b_font"><span className="path1" /><span className="path2" /></span> Profile</a>
                            </li>
                            <li className="nav-item" style={{width: '132px'}} role="presentation" onClick={toggleTier}>
                                <a className={tableToggle ? "nav-link wallet" : "nav-link wallet active"} id="pills-tier-tab" data-toggle="pill" href="#wallet" role="tab" aria-controls="pills-tier" aria-selected="false"><span className="icon-iconly_wallet b_font"><span className="path1" /><span className="path2" /><span className="path3" /></span> Tier </a>
                            </li>
                            </ul>
                        </div>
                        <div className="tab-content" id="pills-tabContent">
                            <div className={tableToggle ? "tab-pane fade show active" : "tab-pane fade"} id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
                              <Profile closeHandle={closeModal}></Profile>
                            </div>
                            <div className={tableToggle ? "tab-pane fade" : "tab-pane fade active show"} id="pills-tier" role="tabpanel" aria-labelledby="pills-tier-tab">
                              <Tire closeHandle={closeModal}></Tire>
                            </div>
                        </div>
                    </div>
                    </div>

                </div>
            </div>
        </div>}
        {mainModalShow && <div className="modal-backdrop fade show"></div>}
        </>
    );

}

export default connect(mapStateToProps)(Settingbutton);
