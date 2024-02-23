import React, { useEffect, useState } from 'react';
import { connect } from "react-redux";
import { reactLocalStorage } from 'reactjs-localstorage';
import validator from 'validator';
import { isPossiblePhoneNumber } from 'react-phone-number-input';
import config from '../config.js'
import toast, { Toaster } from 'react-hot-toast';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;

let WALLET_ADDR = "";
function mapStateToProps(state) {
  WALLET_ADDR = state.walletAddr;
  return { walletAddr: state.walletAddr, tokenInfo: state.tokenInfo };
};

function Profile(props) {
  const [defaultsms, setDefaultSms] = useState('')
  const [defaulteamil, setDefaultEmail] = useState('')
  const [defaultcall, setDefaultCall] = useState('')
  const [defaultwebhook, setDefaultWebHook] = useState('');
  const [defaultNotify, setDefaultNotify] = useState(0);
  const [overwriteNotify, setOverwriteNotify] = useState(0);
  let JWT_TOKEN = reactLocalStorage.get('apiKey')
  useEffect(() => {
    if (props.walletAddr && props.walletAddr !== "Connect") {
      getDefaultData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.walletAddr])
  
  async function getDefaultData() {
   await fetch(SERVER_URL + "/alerts/read", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: props.walletAddr, default: 1 })
    }).then(async (res)=>{
      res = await res.json();
      setDefaultCall(res.message.contactInfo ? res.message.contactInfo.call : "")
      setDefaultEmail(res.message.contactInfo ? res.message.contactInfo.email : "")
      setDefaultSms(res.message.contactInfo ? res.message.contactInfo.sms : "")
      setDefaultWebHook(res.message.contactInfo ? res.message.contactInfo.webhook : "")
    })
  }
  async function saveProfile() {
    console.log('save')
    console.log(overwriteNotify)
    console.log(defaultNotify)
    // if (overwriteNotify === 1) {
      if (defaultsms !== "") {
        if (isPossiblePhoneNumber(defaultsms) === false) {
          toast.error('invalid phone number for sms')
          return;
        }
      }

      if (defaultcall !== "") {
        if (isPossiblePhoneNumber(defaultcall) === false) {
          toast.error('invalid phone number for call')
          return;
        }
      }

      if (defaulteamil !== "") {
        if (validator.isEmail(defaulteamil) === false) {
          toast.error('invalid email address')
          return;
        }
      }

      if (defaultwebhook !== "") {
        if (validator.isURL(defaultwebhook, { protocols: ['http','https'] }) === false) {
          toast.error('invalid webhook url')
          return;
        }
      }
      if (overwriteNotify === 1) {
        let upt = {};
        if (defaulteamil !== "")
          upt['email'] = defaulteamil;

        if (defaultsms !== "")
          upt['sms'] = defaultsms;

        if (defaultcall !== "")
          upt['call'] = defaultcall;

        if (defaultwebhook !== "")
          upt['webhook'] = defaultwebhook;


        if (Object.keys(upt).length > 0) {
          await fetch(SERVER_URL + "/alerts/update", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authent': JWT_TOKEN
            },
            body: JSON.stringify({ walletAddr: props.walletAddr, contactInfo: upt})
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
          body: JSON.stringify({ walletAddr: props.walletAddr, default: 0})
        })
      }
    // }
    props.closeHandle()
    // if (defaultNotify === 1) {
      await fetch(SERVER_URL + "/alerts/update", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authent': JWT_TOKEN
        },
        body: JSON.stringify({ walletAddr: props.walletAddr, default: 0})
      })
    
      await fetch(SERVER_URL + "/alerts/savedefault", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authent': JWT_TOKEN
        },
        body: JSON.stringify({ walletAddr: props.walletAddr, default: 1, contactInfo: {email: defaulteamil ? defaulteamil: '' , sms: defaultsms ? defaultsms : '', call: defaultcall ? defaultcall : '', webhook: defaultwebhook ? defaultwebhook : ''}})
      })
    // }
    
  }

    return (
      <>
        <Toaster />
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
                    <input className="form-control" aria-describedby="emailHelp" placeholder="example@email.com" defaultValue={defaulteamil} onChange={(e) => setDefaultEmail(e.target.value)} style={{color: "white"}}/>
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
                    <input className="form-control" aria-describedby="emailHelp" placeholder="+15017122661"  defaultValue={defaultsms?defaultsms:''} onChange={(e) => setDefaultSms(e.target.value)}  style={{color: "white"}}/>
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
                    <input className="form-control" aria-describedby="emailHelp" placeholder="+15017122661" defaultValue={defaultcall?defaultcall:''} onChange={(e) => setDefaultCall(e.target.value)}  style={{color: "white"}}/>
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
                    <input className="form-control" id="" aria-describedby="emailHelp" placeholder="https://hooks.slack.com/services/XXX" defaultValue={defaultwebhook?defaultwebhook:''} onChange={(e) => setDefaultWebHook(e.target.value)} style={{color: "white"}}/>
                    </div>
                  </div>
                </div>
                <div className="row mb-3">
                    <div className="col-lg-3">
                    </div>
                    <div className="col-lg-9 d-flex extreme-small">
                      <div className="cheak_box">
                        <div className="cutsom-checkbox-row">
                          <input id="checkbox4" type="checkbox" checked={(overwriteNotify > 0) ? true : false} onChange={() => setOverwriteNotify((overwriteNotify > 0) ? 0 : 1)}/>
                          <label htmlFor="checkbox4">Overwrite to All</label>
                        </div>
                      </div>
                    </div>
                  </div>
            </form>
            <div className="btn_channel_save_close">
                <button type="button" className="btn btn-primary save_btn popup1_open" onClick={saveProfile}>Save</button>
                <button type="button" className="btn btn-secondary close_btn" data-dismiss="modal" onClick={props.closeHandle}>Close</button>
            </div>
        </div>
      </>
    )
}

export default connect(mapStateToProps)(Profile)