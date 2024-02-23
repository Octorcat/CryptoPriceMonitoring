import React, { useEffect, useState } from 'react';
import { connect } from "react-redux";
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { reactLocalStorage } from 'reactjs-localstorage';
import config from '../config.js'
import { ethers } from 'ethers'
const SERVER_URL = process.env.REACT_APP_SERVER_URL || config.SERVER_URL;
const NETWORK_URL = "https://bsc-dataseed1.binance.org/"

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    color: theme.palette.common.white,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));



let WALLET_ADDR = "";
function mapStateToProps(state) {
  WALLET_ADDR = state.walletAddr;
  return { walletAddr: state.walletAddr };
};

function Tire(props) {
  const [tierInfo, setTierInfo] = useState({})
  const [emailTier, setEmailTier] = useState(false)
  const [smsTier, setSmsTier] = useState(false)
  const [callTier, setCallTier] = useState(false)
  const [webhookTier, setWebhookTier] = useState(false)
  const [allTier, setAllTier] = useState(false)
  let JWT_TOKEN = reactLocalStorage.get('apiKey')
  const tierType = [
    {
    'name': 'CALL',
    'tier': 'call_tier',
    'acquired': callTier
    },
    {
      'name': 'SMS',
      'tier': 'sms_tier',
      'acquired': smsTier
    },
    {
      'name': 'EMAIL',
      'tier': 'email_tier',
      'acquired': emailTier
    },
    /* {
      'name': 'WEBHOOK',
      'tier': 'webhook_tier',
      'acquired': webhookTier
    }, */
  ]


  async function getMemberShip() {
    let res = await fetch(SERVER_URL + "/tierinfo", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authent': JWT_TOKEN
      },
      body: JSON.stringify({ walletAddr: props.walletAddr})
    })
    res = await res.json()
    const tierInformation = res.message
    setTierInfo(tierInformation)

    if (res.status) {
      const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL);
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
        let tierTokenBal = await tierToken.balanceOf(props.walletAddr)
        let tierLpBal = await tierLp.balanceOf(props.walletAddr)
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

        if(emailTier && smsTier && callTier && webhookTier) setAllTier(true)

      } catch (error) {
        console.log(error)
      }
    } 
  }

  useEffect(() => {
    getMemberShip()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return(
    <>
    <TableContainer component={Paper} style={{marginBottom: '15px'}}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Tier Name</StyledTableCell>
            <StyledTableCell align="left">Max Alert</StyledTableCell>
            <StyledTableCell align="left">Max Email Alerts</StyledTableCell>
            <StyledTableCell align="left">Max Sms Alerts</StyledTableCell>
            <StyledTableCell align="left">Max Call Alerts</StyledTableCell>
            <StyledTableCell align="left">Max Api Alerts</StyledTableCell>
            <StyledTableCell align="left">Acquired</StyledTableCell>
            {!allTier && <StyledTableCell align="left">Upgrade</StyledTableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
        {tierType.map((value, index) => {
          return (
            <StyledTableRow key={index}>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_name`]}</StyledTableCell>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_max_alerts_total`]}</StyledTableCell>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_max_email_alerts`]}</StyledTableCell>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_max_sms_alerts`]}</StyledTableCell>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_max_call_alerts`]}</StyledTableCell>
              <StyledTableCell align="left">{tierInfo[`${tierInfo[value.tier]}_max_api_alerts`]}</StyledTableCell>
              <StyledTableCell align="left">{value.acquired ? 'True' : 'False'}</StyledTableCell>
              {!allTier && <StyledTableCell align="right">{!value.acquired && <a href={`https://pancakeswap.finance/swap?outputCurrency=${tierInfo.tier_token_address}`} target="_blank" rel="noreferrer" style={{textDecoration: 'unset'}}>Here</a>}</StyledTableCell>}
            </StyledTableRow>
          )
        })}
        </TableBody>
      </Table>
    </TableContainer>
    <div className="btn_channel_save_close" style={{paddingBottom: 'unset'}}>
      <button type="button" className="btn btn-secondary close_btn" data-dismiss="modal" onClick={props.closeHandle}>Close</button>
    </div>
    </>
  )
}

export default connect(mapStateToProps)(Tire)