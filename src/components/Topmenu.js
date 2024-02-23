import Connectbutton from './Connectbutton'
import Settingbutton from './Settingbutton'
import { connect } from "react-redux";
import '../style/style.css'

let WALLET_ADDR = "";
function mapStateToProps(state) {
  WALLET_ADDR = state.walletAddr;
  return { walletAddr: state.walletAddr };
};

function Topmenu({ walletAddr }) {
  return (
      <header id="header" className="logo_menu">
          <nav className="navbar">
              <a className="navbar-brand change_logo" href="#wallet"><img src="img/logo_icon.png" className="img-fluid" alt="" /> <b>Web</b>Site</a>
              <div style={{display:'flex'}}>
                {walletAddr !== 'Connect' ? <Settingbutton /> : ''}
                <Connectbutton/>
              </div>
          </nav>
      </header>
  );
}

export default connect(mapStateToProps)(Topmenu);
