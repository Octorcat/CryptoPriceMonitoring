const initialState = {
    walletAddr: '',
    tokenInfo: {}
};
  
function rootReducer(state = initialState, action) {
    switch (action.type) {
        case "walletChanged":
            state.walletAddr = action.payload;
            return {...state, walletAddr: state.walletAddr};
        case "tokenSearched":
            state.tokenInfo = action.payload;
            return {...state, tokenInfo: state.tokenInfo}
        default:
            return state
    }
}
  
export default rootReducer;