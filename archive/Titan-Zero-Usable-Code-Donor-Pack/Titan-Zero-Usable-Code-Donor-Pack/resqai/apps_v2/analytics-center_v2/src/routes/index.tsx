import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../layouts';
import {
  ExecutiveDashboardPage,
  SupportAnalyticsPage,
  OperationsAnalyticsPage,
  AppointmentAnalyticsPage,
  AccountAnalyticsPage,
  DisputeAnalyticsPage,
  TechnicianPerformancePage,
  CustomerAnalyticsPage,
  CRMAnalyticsPage,
  ResolutionAnalyticsPage,
  SLADashboardPage,
  ProductivityDashboardPage,
  TrendAnalysisPage,
  ForecastingPage,
  CustomReportsPage,
  ReportBuilderPage,
  ScheduledReportsPage,
  ReportsPage,
  ExportCenterPage,
  AuditAnalyticsPage,
  SystemHealthPage,
  SearchPage,
} from '../pages';

function getHashRoute(): string {
  const hash = window.location.hash.replace('#', '');
  return hash || '/';
}

function navigateTo(route: string) {
  window.location.hash = route;
}

export function Routes() {
  const [route, setRoute] = useState(getHashRoute);

  useEffect(() => {
    const handler = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const renderPage = () => {
    switch (route) {
      case '/': return <ExecutiveDashboardPage />;
      case '/support': return <SupportAnalyticsPage />;
      case '/operations': return <OperationsAnalyticsPage />;
      case '/appointments': return <AppointmentAnalyticsPage />;
      case '/accounts': return <AccountAnalyticsPage />;
      case '/disputes': return <DisputeAnalyticsPage />;
      case '/technicians': return <TechnicianPerformancePage />;
      case '/customers': return <CustomerAnalyticsPage />;
      case '/crm': return <CRMAnalyticsPage />;
      case '/resolution': return <ResolutionAnalyticsPage />;
      case '/sla': return <SLADashboardPage />;
      case '/productivity': return <ProductivityDashboardPage />;
      case '/trends': return <TrendAnalysisPage />;
      case '/forecasting': return <ForecastingPage />;
      case '/reports': return <ReportsPage />;
      case '/reports/custom': return <CustomReportsPage />;
      case '/reports/builder': return <ReportBuilderPage />;
      case '/reports/scheduled': return <ScheduledReportsPage />;
      case '/export': return <ExportCenterPage />;
      case '/audit': return <AuditAnalyticsPage />;
      case '/health': return <SystemHealthPage />;
      case '/search': return <SearchPage />;
      default: return <ExecutiveDashboardPage />;
    }
  };

  return (
    <AppLayout activeRoute={route} onNavigate={navigateTo}>
      {renderPage()}
    </AppLayout>
  );
}
