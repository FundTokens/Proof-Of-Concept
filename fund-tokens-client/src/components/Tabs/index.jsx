import cn from 'classnames';
import tabs from '@@misc/tabs';

import './Tabs.scss';

function Tabs({ activeTab, setActiveTab }) {
    return (
        <div className="tabs">
            <button className={cn('tab-btn', { active: activeTab === tabs.mint })} onClick={() => setActiveTab(tabs.mint)}>Mint</button>
            <button className={cn('tab-btn', { active: activeTab === tabs.redeem })} onClick={() => setActiveTab(tabs.redeem)}>Redeem</button>
            <button className={cn('tab-btn', { active: activeTab === tabs.create })} onClick={() => setActiveTab(tabs.create)}>Create</button>
        </div>

    );
}
export default Tabs;