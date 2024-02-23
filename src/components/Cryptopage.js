import DetailTable from './Detailtable'
import Searchwidget from './Searchwidget'

function Cryptopage() {
    return (
        <section className="data_table_connect">
	        <div className="container">
                <Searchwidget/>
                <DetailTable/>
            </div>
        </section>
    );
}

export default Cryptopage;
