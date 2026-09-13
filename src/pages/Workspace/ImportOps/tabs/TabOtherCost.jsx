import React, { useState, useEffect } from 'react';
import CostSection from '../../../../components/CostSection';
import CostRollup from '../../../../components/CostRollup';
import PaymentBadge from '../../../../components/PaymentBadge';
import FlexibleCostSection from '../../../../components/FlexibleCostSection';
import api from '../../../../lib/api';

const TabOtherCost = ({ shipmentId, updateContainerCost }) => {
  const [generalCosts, setGeneralCosts] = useState({
    'OTHE (Other Cost)': []
  });

  useEffect(() => {
    const load = async () => {
      const allCosts = await api(`/import-shipments/${shipmentId}/container-costs`);
      const genCosts = { 'OTHE (Other Cost)': [] };
      (Array.isArray(allCosts) ? allCosts : []).forEach(c => {
        if (!c.container_id && genCosts[c.cost_category]) genCosts[c.cost_category].push(c);
      });
      setGeneralCosts(genCosts);
    };
    if (shipmentId) load();
  }, [shipmentId]);

  let totalLanded = 0;
  let totalPlusTax = 0;
  generalCosts['OTHE (Other Cost)'].forEach(c => {
    totalLanded += (Number(c.dpp) || 0);
    totalPlusTax += (Number(c.total) || 0);
  });

  return (
    <div style={{ padding: '0 8px' }}>
      <FlexibleCostSection
        title="Other Cost" category="OTHE (Other Cost)" shipmentId={shipmentId}
        costs={generalCosts['OTHE (Other Cost)']}
        fields={['vendor_name', 'jenis_cost', 'inv_no', 'gp_no', 'ket_other', 'dpp', 'persen_ppn', 'no_fp', 'ppn_auto']}
        onUpdateLocal={(newArr) => setGeneralCosts({ 'OTHE (Other Cost)': newArr })}
        updateContainerCost={updateContainerCost}
      />

      <CostRollup label="LANDED OTHER COST" value={totalLanded} />
      <CostRollup label="TOTAL OTHER COST (+TAX)" value={totalPlusTax} isGrand />
    </div>
  );
};

export default TabOtherCost;
