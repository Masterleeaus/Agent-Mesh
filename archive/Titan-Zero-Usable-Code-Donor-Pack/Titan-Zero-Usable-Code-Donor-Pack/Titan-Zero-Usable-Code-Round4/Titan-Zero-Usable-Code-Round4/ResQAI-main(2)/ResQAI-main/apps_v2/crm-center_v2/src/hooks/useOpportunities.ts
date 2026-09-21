import { useState, useEffect, useCallback } from 'react';
import type { OpportunityDTO } from '../models';

const MOCK_OPPORTUNITIES: OpportunityDTO[] = [
  { id: 'opp-1', accountId: 'acc-1', customerId: 'c-1', customerName: 'Alice Johnson', type: 'renewal', stage: 'negotiation', title: 'Annual service contract renewal', description: 'Renew annual maintenance contract with 5% price increase', value: 45000, probability: 80, expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString(), ownerId: 'u-1', ownerName: 'Sarah Connor', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'opp-2', accountId: 'acc-2', customerId: 'c-2', customerName: 'Bob Smith', type: 'upsell', stage: 'proposal', title: 'Premium support upgrade', description: 'Upgrade from standard to premium support tier for Globex Inc', value: 24000, probability: 60, expectedCloseDate: new Date(Date.now() + 45 * 86400000).toISOString(), ownerId: 'u-1', ownerName: 'Sarah Connor', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'opp-3', accountId: 'acc-3', customerId: 'c-3', customerName: 'Carol Davis', type: 'cross_sell', stage: 'identified', title: 'Extended warranty offer', description: 'Offer extended warranty coverage for existing HVAC units', value: 8500, probability: 25, expectedCloseDate: new Date(Date.now() + 60 * 86400000).toISOString(), ownerId: 'u-2', ownerName: 'Mike Peters', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'opp-4', accountId: 'acc-5', customerId: 'c-5', customerName: 'Eve Martinez', type: 'renewal', stage: 'qualified', title: 'Maintenance plan renewal', description: 'Renew annual HVAC maintenance plan', value: 12000, probability: 90, expectedCloseDate: new Date(Date.now() + 20 * 86400000).toISOString(), ownerId: 'u-2', ownerName: 'Mike Peters', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'opp-5', accountId: 'acc-6', customerId: 'c-6', customerName: 'Frank Lee', type: 'upsell', stage: 'negotiation', title: 'Smart home automation package', description: 'Sell smart thermostat and automation package to Stark Industries', value: 35000, probability: 70, expectedCloseDate: new Date(Date.now() + 25 * 86400000).toISOString(), ownerId: 'u-1', ownerName: 'Sarah Connor', createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'opp-6', accountId: 'acc-7', customerId: 'c-7', customerName: 'Grace Kim', type: 'cross_sell', stage: 'qualified', title: 'Indoor air quality system', description: 'Offer air purification system add-on for Wayne Enterprises', value: 18000, probability: 40, expectedCloseDate: new Date(Date.now() + 50 * 86400000).toISOString(), ownerId: 'u-3', ownerName: 'Lisa Wong', createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

export function useOpportunities() {
  const [data, setData] = useState<OpportunityDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_OPPORTUNITIES);
      setTotal(MOCK_OPPORTUNITIES.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}
